/**
 * The office's XP totals as the server last sent them (`xpState`), outside
 * React so the overlay (read every frame) and the Levels panel share one copy.
 */

import { useSyncExternalStore } from 'react';

import type { XpState } from '../../../core/src/messages.js';
import { emptyXp, levelOf, roleKey, type XpTotals } from '../../../core/src/xp.js';

let totals: XpTotals = emptyXp();
const listeners = new Set<() => void>();

/** Take an xpState message (useExtensionMessages). Returns whether it was one. */
export function handleXpMessage(msg: { type?: unknown; [key: string]: unknown }): boolean {
  if (msg.type !== 'xpState') return false;
  const m = msg as unknown as XpState;
  totals = {
    lead: typeof m.lead === 'number' ? m.lead : 0,
    roles: m.roles && typeof m.roles === 'object' ? { ...m.roles } : {},
    skills: m.skills && typeof m.skills === 'object' ? { ...m.skills } : {},
  };
  for (const l of listeners) l();
  return true;
}

export function getXp(): XpTotals {
  return totals;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useXp(): XpTotals {
  return useSyncExternalStore(subscribe, getXp);
}

export const leadLevel = (): number => levelOf(totals.lead);
export const roleLevel = (role: string): number => levelOf(totals.roles[roleKey(role)] ?? 0);
export const skillLevel = (skill: string): number => levelOf(totals.skills[skill] ?? 0);
