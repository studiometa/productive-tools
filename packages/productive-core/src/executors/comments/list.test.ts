import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { buildCommentFilters, listComments } from './list.js';

describe('buildCommentFilters', () => {
  it('maps typed options to API filter names', () => {
    const filters = buildCommentFilters({
      taskId: '100',
      dealId: '200',
      companyId: '300',
      personId: '400',
    });
    expect(filters).toEqual({
      task_id: '100',
      deal_id: '200',
      company_id: '300',
      person_id: '400',
    });
  });

  it('returns empty filter for empty options', () => {
    expect(buildCommentFilters({})).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildCommentFilters({
      taskId: '100',
      additionalFilters: { custom: 'value' },
    });
    expect(filters.task_id).toBe('100');
    expect(filters.custom).toBe('value');
  });
});

describe('listComments', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'comments', attributes: { body: 'Hello' } }],
    meta: { current_page: 1, total_pages: 1 },
  };

  it('passes filters and pagination to API', async () => {
    const getComments = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getComments } });

    await listComments({ taskId: '100', page: 2, perPage: 50, include: ['person'] }, ctx);

    expect(getComments).toHaveBeenCalledWith({
      page: 2,
      perPage: 50,
      filter: { task_id: '100' },
      include: ['person'],
    });
  });

  it('uses default pagination', async () => {
    const getComments = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getComments } });

    await listComments({}, ctx);

    expect(getComments).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 100 }));
  });

  it('returns data and meta', async () => {
    const getComments = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getComments } });

    const result = await listComments({}, ctx);

    expect(result.data).toEqual(mockResponse.data);
    expect(result.meta).toEqual(mockResponse.meta);
  });
});
