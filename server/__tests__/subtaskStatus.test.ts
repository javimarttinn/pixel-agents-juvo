import { describe, expect, it } from 'vitest';

import {
  formatSubtaskStatus,
  nameMatchesRole,
  parseSubtaskStatus,
} from '../../core/src/subtaskStatus.js';
import { claudeProvider } from '../src/providers/hook/claude/claude.js';

describe('subtask status', () => {
  it('round-trips a spawn with and without a sub-agent type', () => {
    expect(formatSubtaskStatus('Revisar auth', 'reviewer')).toBe(
      'Subtarea [reviewer]: Revisar auth',
    );
    expect(parseSubtaskStatus('Subtarea [reviewer]: Revisar auth')).toEqual({
      role: 'reviewer',
      label: 'Revisar auth',
    });
    expect(formatSubtaskStatus('Investigar')).toBe('Subtarea: Investigar');
    expect(parseSubtaskStatus('Subtarea: Investigar')).toEqual({ role: null, label: 'Investigar' });
  });

  it('is null for statuses that are not spawns', () => {
    expect(parseSubtaskStatus('Leyendo a.ts')).toBeNull();
    expect(parseSubtaskStatus('Ejecutando subtarea')).toBeNull();
    expect(parseSubtaskStatus(undefined)).toBeNull();
  });

  it('carries subagent_type from a Task/Agent call', () => {
    expect(
      claudeProvider.formatToolStatus('Agent', {
        description: 'Review',
        subagent_type: 'reviewer',
      }),
    ).toBe('Subtarea [reviewer]: Review');
    expect(claudeProvider.formatToolStatus('Agent', { subagent_type: 'Explore' })).toBe(
      'Subtarea [Explore]: ',
    );
    expect(claudeProvider.formatToolStatus('Task', {})).toBe('Ejecutando subtarea');
  });

  it('matches roster names to roles, ignoring case and dashes, with built-in aliases', () => {
    expect(nameMatchesRole('Reviewer', 'reviewer')).toBe(true);
    expect(nameMatchesRole('Planner', 'Plan')).toBe(true);
    expect(nameMatchesRole('Explorer', 'Explore')).toBe(true);
    expect(nameMatchesRole('General', 'general-purpose')).toBe(true);
    expect(nameMatchesRole('Code Reviewer', 'code-reviewer')).toBe(true);
    expect(nameMatchesRole('Tester', 'reviewer')).toBe(false);
    expect(nameMatchesRole(undefined, 'reviewer')).toBe(false);
  });
});
