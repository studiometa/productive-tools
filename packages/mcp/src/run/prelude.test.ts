/**
 * Tests for the guest prelude builder.
 */

import { describe, it, expect } from 'vitest';

import { buildPrelude, SCRIPT_RESOURCES } from './prelude.js';

describe('SCRIPT_RESOURCES', () => {
  it('includes common data resources', () => {
    expect(SCRIPT_RESOURCES).toContain('tasks');
    expect(SCRIPT_RESOURCES).toContain('projects');
    expect(SCRIPT_RESOURCES).toContain('time');
  });

  it('excludes meta/aggregate resources', () => {
    for (const meta of ['batch', 'search', 'summaries', 'workflows', 'reports']) {
      expect(SCRIPT_RESOURCES).not.toContain(meta);
    }
  });
});

describe('buildPrelude', () => {
  it('embeds args and flags as JSON literals', () => {
    const src = buildPrelude({ args: ['a', 'b'], flags: { mine: true, n: 3 } });
    expect(src).toContain('const args = ["a","b"]');
    expect(src).toContain('const flags = {"mine":true,"n":3}');
  });

  it('exposes the expected globals', () => {
    const src = buildPrelude({ args: [], flags: {} });
    expect(src).toContain('Object.assign(globalThis, { productive, api, output, args, flags })');
  });
});
