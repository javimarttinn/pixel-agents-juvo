import { SUBTASK_STATUS_PREFIX } from './constants.js';

/**
 * A sub-agent spawn's status line: `Subtarea: <description>`, or, when the
 * spawn names its sub-agent type, `Subtarea [<type>]: <description>`. The type
 * rides in the status (not in a message field) so every path that replays a
 * status — JSONL, the reconnect resend, background re-broadcasts — carries it,
 * and the office can dress the sub-agent as the roster character of that role.
 */

const SUBTASK_BASE = SUBTASK_STATUS_PREFIX.replace(/:\s*$/, '');
const SUBTASK_RE = new RegExp(`^${SUBTASK_BASE}(?: \\[([^\\]]+)\\])?:\\s*(.*)$`, 's');

export function formatSubtaskStatus(description: string, subagentType?: string): string {
  const role = subagentType?.trim();
  return role
    ? `${SUBTASK_BASE} [${role}]: ${description}`
    : `${SUBTASK_STATUS_PREFIX}${description}`;
}

/** The role (sub-agent type, if named) and label of a spawn's status, or null for any other status. */
export function parseSubtaskStatus(
  status: string | null | undefined,
): { role: string | null; label: string } | null {
  if (typeof status !== 'string') return null;
  const m = SUBTASK_RE.exec(status);
  if (!m) return null;
  return { role: m[1]?.trim() || null, label: m[2].trim() };
}

/** Built-in Claude Code sub-agent types → the roster name that plays them. */
const ROLE_ALIASES: Record<string, string> = {
  plan: 'planner',
  explore: 'explorer',
  generalpurpose: 'general',
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Does a roster character's name play this sub-agent type? Case, spaces and
 *  dashes are ignored, and the built-in types map to their role names. */
export function nameMatchesRole(name: string | undefined, role: string): boolean {
  if (!name) return false;
  const r = norm(role);
  const n = norm(name);
  return n.length > 0 && (n === r || n === ROLE_ALIASES[r]);
}
