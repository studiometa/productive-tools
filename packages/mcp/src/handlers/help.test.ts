/**
 * Tests for help documentation handlers, focused on cross-resource search.
 */

import { describe, it, expect } from 'vitest';

import type { ToolResult } from './types.js';

import {
  handleHelp,
  handleHelpOverview,
  handleHelpSearch,
  helpResourceNames,
  searchResourceHelp,
} from './help.js';

function parse(result: ToolResult): Record<string, unknown> {
  const content = result.content[0];
  if (content?.type === 'text') return JSON.parse(content.text);
  throw new Error('unexpected result');
}

describe('helpResourceNames', () => {
  it('lists known resources', () => {
    const names = helpResourceNames();
    expect(names).toContain('tasks');
    expect(names).toContain('time');
    expect(names).toContain('projects');
  });
});

describe('searchResourceHelp', () => {
  it('matches a resource by name', () => {
    const matches = searchResourceHelp('tasks');
    const task = matches.find((m) => m.resource === 'tasks');
    expect(task).toBeDefined();
    expect(task?.matched_in).toContain('resource name');
  });

  it('matches across resources by a shared term and ranks by hit count', () => {
    const matches = searchResourceHelp('project');
    expect(matches.length).toBeGreaterThan(1);
    // Sorted by number of matched areas, descending.
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].matched_in.length).toBeGreaterThanOrEqual(matches[i].matched_in.length);
    }
  });

  it('returns nothing for a nonsense query', () => {
    expect(searchResourceHelp('zzqqxx-nope')).toEqual([]);
  });
});

describe('handleHelpSearch', () => {
  it('returns matches with a drill-in tip', () => {
    const body = parse(handleHelpSearch('tasks'));
    expect(body.query).toBe('tasks');
    expect(Array.isArray(body.matches)).toBe(true);
    expect((body.matches as unknown[]).length).toBeGreaterThan(0);
    expect(String(body._tip)).toContain('action="help"');
  });

  it('falls back to the resource list when nothing matches', () => {
    const body = parse(handleHelpSearch('zzqqxx-nope'));
    expect(body.matches).toEqual([]);
    expect(body.available_resources).toEqual(helpResourceNames());
  });
});

describe('handleHelp / handleHelpOverview (existing behaviour)', () => {
  it('returns full docs for a known resource', () => {
    const body = parse(handleHelp('tasks'));
    expect(body.resource).toBe('tasks');
    expect(body.actions).toBeDefined();
  });

  it('errors for an unknown resource', () => {
    const body = parse(handleHelp('nope'));
    expect(String(body.error)).toContain('Unknown resource');
  });

  it('overview lists all resources', () => {
    const body = parse(handleHelpOverview());
    expect(Array.isArray(body.resources)).toBe(true);
  });
});
