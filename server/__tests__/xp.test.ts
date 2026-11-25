import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { levelOf, levelProgress, xpForLevel } from '../../core/src/xp.js';
import { awardToolXp, resetXpForTests, xpStateMessage } from '../src/xp.js';

describe('levels', () => {
  it('starts at level 1 and climbs on a square curve', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(9)).toBe(1);
    expect(levelOf(10)).toBe(2);
    expect(levelOf(40)).toBe(3);
    expect(levelOf(810)).toBe(10);
    expect(xpForLevel(3)).toBe(40);
    expect(levelProgress(25)).toBeCloseTo(0.5);
  });
});

describe('awardToolXp', () => {
  let dir: string;
  const broadcast = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xp-'));
    resetXpForTests(path.join(dir, 'xp.json'));
    broadcast.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('credits the lead for its own tool calls, once per tool_use id', () => {
    expect(awardToolXp({ toolUseId: 't1', toolName: 'Read' }, broadcast)).toBe(true);
    expect(awardToolXp({ toolUseId: 't1', toolName: 'Read' }, broadcast)).toBe(false);
    expect(xpStateMessage().lead).toBe(1);
  });

  it('credits a skill by name, from its input or its status line', () => {
    awardToolXp(
      { toolUseId: 's1', toolName: 'Skill', input: { skill: 'design:ux-copy' } },
      broadcast,
    );
    awardToolXp({ toolUseId: 's2', toolName: 'Skill', status: 'Skill: ux-copy' }, broadcast);
    expect(xpStateMessage().skills).toEqual({ 'ux-copy': 20 });
  });

  it('credits a role for spawns and for the calls its sub-agents make', () => {
    awardToolXp(
      { toolUseId: 'a1', toolName: 'Agent', input: { subagent_type: 'Code-Reviewer' } },
      broadcast,
    );
    awardToolXp(
      { toolUseId: 'r1', toolName: 'Grep', spawnStatus: 'Subtarea [code-reviewer]: Revisar' },
      broadcast,
    );
    const state = xpStateMessage();
    expect(state.roles).toEqual({ 'code-reviewer': 6 });
    expect(state.lead).toBe(1);
  });

  it('broadcasts once per burst and persists the totals', () => {
    awardToolXp({ toolUseId: 'b1', toolName: 'Read' }, broadcast);
    awardToolXp({ toolUseId: 'b2', toolName: 'Edit' }, broadcast);
    vi.advanceTimersByTime(3_000);
    expect(broadcast).toHaveBeenCalledTimes(1);
    expect(broadcast.mock.calls[0][0]).toMatchObject({ type: 'xpState', lead: 2 });
    const saved = JSON.parse(fs.readFileSync(path.join(dir, 'xp.json'), 'utf-8'));
    expect(saved.lead).toBe(2);
  });
});
