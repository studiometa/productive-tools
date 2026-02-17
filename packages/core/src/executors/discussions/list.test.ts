import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { buildDiscussionFilters, listDiscussions } from './list.js';

describe('buildDiscussionFilters', () => {
  it('maps pageId to page_id', () => {
    const filters = buildDiscussionFilters({ pageId: '123' });
    expect(filters.page_id).toBe('123');
  });

  it('maps status "active" to "1"', () => {
    const filters = buildDiscussionFilters({ status: 'active' });
    expect(filters.status).toBe('1');
  });

  it('maps status "resolved" to "2"', () => {
    const filters = buildDiscussionFilters({ status: 'resolved' });
    expect(filters.status).toBe('2');
  });

  it('does not set status for unknown values', () => {
    const filters = buildDiscussionFilters({ status: 'unknown' });
    expect(filters.status).toBeUndefined();
  });

  it('returns empty object when no options', () => {
    const filters = buildDiscussionFilters({});
    expect(filters).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildDiscussionFilters({
      pageId: '123',
      additionalFilters: { custom: 'value' },
    });
    expect(filters.page_id).toBe('123');
    expect(filters.custom).toBe('value');
  });
});

describe('listDiscussions', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'discussions', attributes: { body: 'Test', status: 1 } }],
    meta: { current_page: 1, total_pages: 1 },
    included: [],
  };

  it('calls getDiscussions with correct params', async () => {
    const getDiscussions = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getDiscussions } });

    const result = await listDiscussions({ pageId: '123', status: 'active' }, ctx);

    expect(getDiscussions).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        perPage: 100,
        filter: { page_id: '123', status: '1' },
      }),
    );
    expect(result.data).toEqual(mockResponse.data);
  });

  it('resolves filters through resolver', async () => {
    const getDiscussions = vi.fn().mockResolvedValue(mockResponse);
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { page_id: '100' },
      metadata: { page_id: { original: 'my-page', resolved: '100', type: 'page' } },
    });
    const ctx = createTestExecutorContext({
      api: { getDiscussions },
      resolver: { resolveFilters },
    });

    const result = await listDiscussions({ pageId: 'my-page' }, ctx);
    expect(result.resolved).toBeDefined();
  });

  it('returns no resolved metadata when filters are unchanged', async () => {
    const getDiscussions = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getDiscussions } });

    const result = await listDiscussions({ pageId: '123' }, ctx);
    expect(result.resolved).toBeUndefined();
  });
});
