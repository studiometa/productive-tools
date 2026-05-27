import { describe, expect, it } from 'vitest';

import type { ScriptMeta } from './meta.js';

describe('ScriptMeta', () => {
  it('accepts a fully-populated meta object', () => {
    const meta: ScriptMeta = {
      name: 'Weekly Report',
      description: 'Summarise time entries for the past week.',
      usage: '--from <date> --to <date>',
    };
    expect(meta.name).toBe('Weekly Report');
    expect(meta.description).toBe('Summarise time entries for the past week.');
    expect(meta.usage).toBe('--from <date> --to <date>');
  });

  it('accepts a partial meta object (all fields optional)', () => {
    const meta: ScriptMeta = {};
    expect(meta.name).toBeUndefined();
    expect(meta.description).toBeUndefined();
    expect(meta.usage).toBeUndefined();
  });
});
