import { describe, expect, it } from 'vitest';

import { extractToolName, skillNameFromStatus } from '../src/office/toolUtils.js';

describe('skillNameFromStatus', () => {
  it('reads the skill back from its status line', () => {
    expect(skillNameFromStatus('Skill: spec-mvp')).toBe('spec-mvp');
  });

  it('is null for other tools, a bare "Skill" and non-strings', () => {
    expect(skillNameFromStatus('Leyendo foo.ts')).toBeNull();
    expect(skillNameFromStatus('Skill')).toBeNull();
    expect(skillNameFromStatus('Skill: ')).toBeNull();
    expect(skillNameFromStatus(null)).toBeNull();
  });

  it('maps the status back to the Skill tool for animation', () => {
    expect(extractToolName('Skill: spec-mvp')).toBe('Skill');
  });
});
