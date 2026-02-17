/**
 * Tests for MCP resolve handler.
 *
 * Core resolve logic (detectResourceType, isNumericId, resolve,
 * resolveFilters, etc.) is tested in productive-core.
 * This file tests the MCP-specific handleResolve wrapper.
 */
import { createTestExecutorContext } from '@studiometa/productive-core';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { HandlerContext } from './handlers/types.js';

import { handleResolve } from './handlers/resolve.js';

function createMockCtx(apiOverrides: Record<string, unknown> = {}): HandlerContext {
  const execCtx = createTestExecutorContext({ api: apiOverrides });

  return {
    formatOptions: { compact: false },
    perPage: 20,
    executor: () => execCtx,
  };
}

describe('handleResolve', () => {
  let mockApi: {
    getPeople: ReturnType<typeof vi.fn>;
    getCompanies: ReturnType<typeof vi.fn>;
  };

  let mockCtx: HandlerContext;

  beforeEach(() => {
    mockApi = {
      getPeople: vi.fn(),
      getCompanies: vi.fn(),
    };

    mockCtx = createMockCtx(mockApi);
  });

  it('returns error when query is missing', async () => {
    const result = await handleResolve({}, mockCtx);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('query is required');
  });

  it('returns matches for valid email query', async () => {
    mockApi.getPeople.mockResolvedValue({
      data: [
        {
          id: '500521',
          attributes: { first_name: 'John', last_name: 'Doe' },
        },
      ],
    });

    const result = await handleResolve({ query: 'john@example.com' }, mockCtx);

    expect(result.isError).toBeUndefined();
    const content = JSON.parse(result.content[0].text as string);
    expect(content.query).toBe('john@example.com');
    expect(content.matches).toHaveLength(1);
    expect(content.matches[0].id).toBe('500521');
  });

  it('returns exact: true for single exact match', async () => {
    mockApi.getPeople.mockResolvedValue({
      data: [{ id: '500521', attributes: { first_name: 'John', last_name: 'Doe' } }],
    });

    const result = await handleResolve({ query: 'john@example.com' }, mockCtx);

    const content = JSON.parse(result.content[0].text as string);
    expect(content.exact).toBe(true);
  });

  it('returns exact: false for multiple matches', async () => {
    mockApi.getCompanies.mockResolvedValue({
      data: [
        { id: '1', attributes: { name: 'Meta Corp' } },
        { id: '2', attributes: { name: 'Meta Inc' } },
      ],
    });

    const result = await handleResolve({ query: 'Meta', type: 'company' }, mockCtx);

    const content = JSON.parse(result.content[0].text as string);
    expect(content.exact).toBe(false);
  });

  it('uses explicit type when provided', async () => {
    mockApi.getCompanies.mockResolvedValue({
      data: [{ id: '123', attributes: { name: 'Test Company' } }],
    });

    const result = await handleResolve({ query: 'Test', type: 'company' }, mockCtx);

    expect(mockApi.getCompanies).toHaveBeenCalled();
    const content = JSON.parse(result.content[0].text as string);
    expect(content.matches[0].type).toBe('company');
  });

  it('returns error for no matches', async () => {
    mockApi.getPeople.mockResolvedValue({ data: [] });

    const result = await handleResolve({ query: 'unknown@example.com' }, mockCtx);

    expect(result.isError).toBe(true);
  });

  it('returns error for ambiguous query without type', async () => {
    const result = await handleResolve({ query: 'ambiguous' }, mockCtx);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Cannot determine resource type');
  });

  it('re-throws non-ResolveError errors', async () => {
    mockApi.getPeople.mockRejectedValue(new Error('Network error'));

    await expect(handleResolve({ query: 'john@example.com' }, mockCtx)).rejects.toThrow(
      'Network error',
    );
  });
});
