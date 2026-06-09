/**
 * Tests for the global search_docs handler.
 */

import { describe, it, expect } from 'vitest';

import type { ToolResult } from './types.js';

import { handleSearchDocs } from './search-docs.js';

function parse(result: ToolResult): Record<string, unknown> {
  const content = result.content[0];
  if (content?.type === 'text') return JSON.parse(content.text);
  throw new Error('unexpected result');
}

describe('handleSearchDocs', () => {
  it('returns a table of contents across domains with no query', () => {
    const body = parse(handleSearchDocs());
    const domains = body.domains as Array<Record<string, unknown>>;
    expect(domains.map((d) => d.domain)).toEqual(['resources', 'api_endpoints', 'run_script']);

    const resources = domains.find((d) => d.domain === 'resources')!;
    expect((resources.resources as string[]).length).toBeGreaterThan(0);
    expect(resources.count).toBe((resources.resources as string[]).length);

    const endpoints = domains.find((d) => d.domain === 'api_endpoints')!;
    expect(endpoints.count).toBeGreaterThan(0);

    const scripting = domains.find((d) => d.domain === 'run_script')!;
    expect((scripting.topics as string[]).length).toBeGreaterThan(0);

    for (const d of domains) expect(typeof d.drill_in).toBe('string');
  });

  it('aggregates matches across the three domains for a query', () => {
    const body = parse(handleSearchDocs('table'));
    expect(body.query).toBe('table');
    // "table" appears in the run_script output docs at least.
    const scripting = body.run_script as { count: number; matches: unknown[] };
    expect(scripting.count).toBeGreaterThan(0);
    expect(body.api_endpoints).toBeDefined();
    expect(body.resources).toBeDefined();
    expect(typeof body.total).toBe('number');
  });

  it('reports a domain count and drill-in pointers per domain', () => {
    const body = parse(handleSearchDocs('time'));
    for (const key of ['resources', 'api_endpoints', 'run_script']) {
      const domain = body[key] as Record<string, unknown>;
      expect(typeof domain.count).toBe('number');
      expect(typeof domain.drill_in).toBe('string');
      expect(Array.isArray(domain.matches)).toBe(true);
    }
  });

  it('handles a no-match query with a helpful tip', () => {
    const body = parse(handleSearchDocs('zzqqxx-nope'));
    expect(body.total).toBe(0);
    expect(String(body._tip)).toContain('table of contents');
  });

  it('treats a blank query as no query (table of contents)', () => {
    const body = parse(handleSearchDocs('   '));
    expect(body.domains).toBeDefined();
  });
});
