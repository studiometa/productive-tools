import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { buildPageFilters, listPages } from './list.js';

describe('buildPageFilters', () => {
  it('maps projectId to project_id', () => {
    const filters = buildPageFilters({ projectId: '123' });
    expect(filters.project_id).toBe('123');
  });

  it('maps creatorId to creator_id', () => {
    const filters = buildPageFilters({ creatorId: '456' });
    expect(filters.creator_id).toBe('456');
  });

  it('returns empty object when no options', () => {
    const filters = buildPageFilters({});
    expect(filters).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildPageFilters({
      projectId: '123',
      additionalFilters: { custom: 'value' },
    });
    expect(filters.project_id).toBe('123');
    expect(filters.custom).toBe('value');
  });
});

describe('listPages', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'pages', attributes: { title: 'Page 1' } }],
    meta: { current_page: 1, total_pages: 1 },
    included: [],
  };

  it('calls getPages with correct params', async () => {
    const getPages = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getPages } });

    const result = await listPages({ projectId: '123', page: 2, perPage: 50 }, ctx);

    expect(getPages).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        perPage: 50,
        filter: { project_id: '123' },
      }),
    );
    expect(result.data).toEqual(mockResponse.data);
  });

  it('resolves filters through resolver', async () => {
    const getPages = vi.fn().mockResolvedValue(mockResponse);
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { project_id: '100' },
      metadata: { project_id: { original: 'my-project', resolved: '100', type: 'project' } },
    });
    const ctx = createTestExecutorContext({
      api: { getPages },
      resolver: { resolveFilters },
    });

    const result = await listPages({ projectId: 'my-project' }, ctx);

    expect(resolveFilters).toHaveBeenCalled();
    expect(result.resolved).toBeDefined();
  });

  it('returns no resolved metadata when filters are unchanged', async () => {
    const getPages = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getPages } });

    const result = await listPages({ projectId: '123' }, ctx);
    expect(result.resolved).toBeUndefined();
  });

  it('uses defaults for page and perPage', async () => {
    const getPages = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getPages } });

    await listPages({}, ctx);

    expect(getPages).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 100 }));
  });
});
