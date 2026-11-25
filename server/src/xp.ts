/**
 * Office levels: the server awards XP from the tool calls it reads in
 * transcripts and keeps the totals in ~/.pixel-agents/xp.json. Every client
 * gets an `xpState` on connect and after each change (throttled).
 *
 * The transcript is the single source: hooks and JSONL both report a tool, but
 * only the JSONL tool_use block has a stable id, so each call is counted once
 * (ids already awarded are remembered for the life of the process).
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { SKILL_STATUS_PREFIX } from '../../core/src/constants.js';
import type { XpState } from '../../core/src/messages.js';
import { parseSubtaskStatus } from '../../core/src/subtaskStatus.js';
import { emptyXp, roleKey, XP_SKILL, XP_SPAWN, XP_TOOL, type XpTotals } from '../../core/src/xp.js';
import { PIXEL_AGENTS_DIR } from './constants.js';
import { writeJsonAtomic } from './jsonFileWatcher.js';

const XP_FILE_NAME = 'xp.json';
const SAVE_DELAY_MS = 2_000;
const BROADCAST_DELAY_MS = 500;
const MAX_REMEMBERED_TOOL_IDS = 5_000;

type Broadcast = (message: XpState) => void;

let totals: XpTotals | null = null;
let fileOverride: string | null = null;
const awarded = new Set<string>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let broadcastTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBroadcast: Broadcast | null = null;

function xpFile(): string {
  return fileOverride ?? path.join(os.homedir(), PIXEL_AGENTS_DIR, XP_FILE_NAME);
}

function numberRecord(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = Math.floor(v);
  }
  return out;
}

function load(): XpTotals {
  if (totals) return totals;
  try {
    const raw = JSON.parse(fs.readFileSync(xpFile(), 'utf-8')) as Record<string, unknown>;
    totals = {
      lead: typeof raw.lead === 'number' && raw.lead > 0 ? Math.floor(raw.lead) : 0,
      roles: numberRecord(raw.roles),
      skills: numberRecord(raw.skills),
    };
  } catch {
    totals = emptyXp();
  }
  return totals;
}

function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      writeJsonAtomic(xpFile(), totals);
    } catch (err) {
      console.error(`[Pixel Agents] XP: could not save ${xpFile()}: ${String(err)}`);
    }
  }, SAVE_DELAY_MS);
  saveTimer.unref?.();
}

function scheduleBroadcast(broadcast: Broadcast): void {
  pendingBroadcast = broadcast;
  if (broadcastTimer) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    pendingBroadcast?.(xpStateMessage());
  }, BROADCAST_DELAY_MS);
  broadcastTimer.unref?.();
}

/** The current totals as the message clients receive. */
export function xpStateMessage(): XpState {
  const t = load();
  return { type: 'xpState', lead: t.lead, roles: { ...t.roles }, skills: { ...t.skills } };
}

/** One tool call read from a transcript. */
export interface ToolXpEvent {
  /** The tool_use block's id: dedupes replays and the hook/JSONL double report. */
  toolUseId: string;
  toolName: string;
  input?: Record<string, unknown>;
  /** The call's status line, for when the input is not at hand (a skill's name). */
  status?: string;
  /** For a call made INSIDE a sub-agent: its spawn's status line
   *  (`Subtarea [role]: …`), whose role earns the XP. Undefined for the lead. */
  spawnStatus?: string;
}

/** Award XP for one tool call. Returns true when XP was awarded. */
export function awardToolXp(
  { toolUseId, toolName, input, status, spawnStatus }: ToolXpEvent,
  broadcast: Broadcast,
): boolean {
  if (!toolUseId || awarded.has(toolUseId)) return false;
  awarded.add(toolUseId);
  if (awarded.size > MAX_REMEMBERED_TOOL_IDS) {
    // Forget the oldest half; Sets iterate in insertion order.
    let drop = awarded.size / 2;
    for (const id of awarded) {
      if (drop-- <= 0) break;
      awarded.delete(id);
    }
  }

  const t = load();
  const role = spawnStatus ? parseSubtaskStatus(spawnStatus)?.role : null;
  const actorRole = role ? roleKey(role) : null;
  const credit = (amount: number) => {
    if (actorRole) t.roles[actorRole] = (t.roles[actorRole] ?? 0) + amount;
    else t.lead += amount;
  };

  credit(XP_TOOL);
  if (toolName === 'Skill') {
    const raw = input?.skill ?? input?.command ?? input?.name;
    const name =
      typeof raw === 'string'
        ? raw.replace(/^\//, '').split(':').pop()
        : status?.startsWith(SKILL_STATUS_PREFIX)
          ? status.slice(SKILL_STATUS_PREFIX.length).trim()
          : '';
    if (name) t.skills[name] = (t.skills[name] ?? 0) + XP_SKILL;
  } else if (toolName === 'Agent' || toolName === 'Task') {
    const spawned = typeof input?.subagent_type === 'string' ? input.subagent_type : '';
    if (spawned) {
      const key = roleKey(spawned);
      t.roles[key] = (t.roles[key] ?? 0) + XP_SPAWN;
    }
  }

  scheduleSave();
  scheduleBroadcast(broadcast);
  return true;
}

/** Tests only: start from an empty office backed by `file`. */
export function resetXpForTests(file: string): void {
  fileOverride = file;
  totals = null;
  awarded.clear();
  if (saveTimer) clearTimeout(saveTimer);
  if (broadcastTimer) clearTimeout(broadcastTimer);
  saveTimer = null;
  broadcastTimer = null;
}
