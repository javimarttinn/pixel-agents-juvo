/**
 * Levels for the office: experience earned by the main agents ("lead"), by
 * each sub-agent role (planner, reviewer…) and by each skill. The server
 * awards and persists XP (server/src/xp.ts); everyone reads levels from here.
 *
 * Level n starts at XP_PER_LEVEL × (n − 1)²: early levels come quickly, later
 * ones take real work (2 at 10 XP, 3 at 40, 5 at 160, 10 at 810).
 */

export const XP_PER_LEVEL = 10;

/** XP for one tool call by an agent (lead or sub-agent role). */
export const XP_TOOL = 1;
/** XP a role earns each time it is spawned as a sub-agent. */
export const XP_SPAWN = 5;
/** XP a skill earns each time an agent loads it. */
export const XP_SKILL = 10;

export interface XpTotals {
  lead: number;
  roles: Record<string, number>;
  skills: Record<string, number>;
}

export function emptyXp(): XpTotals {
  return { lead: 0, roles: {}, skills: {} };
}

export function levelOf(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / XP_PER_LEVEL)) + 1;
}

/** XP at which a level starts. */
export function xpForLevel(level: number): number {
  return XP_PER_LEVEL * Math.max(0, level - 1) ** 2;
}

/** Share of the way from this level to the next (0–1). */
export function levelProgress(xp: number): number {
  const level = levelOf(xp);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  return Math.min(1, Math.max(0, (xp - from) / (to - from)));
}

/** Roles are keyed case- and punctuation-insensitively ("Code-Reviewer" = "code reviewer"). */
export function roleKey(role: string): string {
  return role
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}
