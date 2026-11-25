import { SKILL_STATUS_PREFIX } from '../../../core/src/constants.js';

/** Map status prefixes back to tool names for animation selection */
const STATUS_TO_TOOL: Record<string, string> = {
  // Order matters: the first prefix that matches wins (longest first).
  Leyendo: 'Read',
  'Buscando en la web': 'WebSearch',
  'Buscando archivos': 'Glob',
  Buscando: 'Grep',
  Consultando: 'WebFetch',
  Escribiendo: 'Write',
  Editando: 'Edit',
  'Ejecutando subtarea': 'Task',
  Ejecutando: 'Bash',
  Subtarea: 'Task',
  [SKILL_STATUS_PREFIX.trim()]: 'Skill',
};

export function extractToolName(status: string): string | null {
  for (const [prefix, tool] of Object.entries(STATUS_TO_TOOL)) {
    if (status.startsWith(prefix)) return tool;
  }
  const first = status.split(/[\s:]/)[0];
  return first || null;
}

// ── Provider capabilities (tool taxonomy for rendering decisions) ────────────
// Populated once by the `providerCapabilities` postMessage after `webviewReady`.
// Modules classifying tools (character animation, subagent creation gate) read
// from here instead of hardcoding Claude-specific tool names.

const providerCaps: {
  readingTools: Set<string>;
  subagentToolNames: Set<string>;
} = {
  readingTools: new Set(),
  subagentToolNames: new Set(),
};

export function setProviderCapabilities(caps: {
  readingTools: string[];
  subagentToolNames: string[];
}): void {
  providerCaps.readingTools = new Set(caps.readingTools);
  providerCaps.subagentToolNames = new Set(caps.subagentToolNames);
}

export function isReadingToolName(name: string | null | undefined): boolean {
  return typeof name === 'string' && providerCaps.readingTools.has(name);
}

export function isSubagentToolName(name: string | null | undefined): boolean {
  return typeof name === 'string' && providerCaps.subagentToolNames.has(name);
}

/** The skill a status line names (`Skill: spec-mvp` → `spec-mvp`), or null. */
export function skillNameFromStatus(status: string | null | undefined): string | null {
  if (typeof status !== 'string' || !status.startsWith(SKILL_STATUS_PREFIX)) return null;
  const name = status.slice(SKILL_STATUS_PREFIX.length).trim();
  return name || null;
}
