import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { buildBudgetFilters, listBudgets } from '../list.js';

describe('buildBudgetFilters', () => {
  it('maps typed options to API filter names', () => {
    const filters = buildBudgetFilters({
      projectId: '100',
      companyId: '200',
    });
    expect(filters).toEqual({
      project_id: '100',
      company_id: '200',
    });
  });

  it('returns empty filter for empty options', () => {
    expect(buildBudgetFilters({})).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildBudgetFilters({
      projectId: '100',
      additionalFilters: { custom: 'value' },
    });
    expect(filters.project_id).toBe('100');
    expect(filters.custom).toBe('value');
  });
});

describe('listBudgets', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'budgets', attributes: { name: 'Q1 Budget' } }],
    meta: { current_page: 1, total_pages: 1 },
  };

  it('passes filters and pagination to API', async () => {
    const getBudgets = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getBudgets } });

    await listBudgets({ projectId: '100', page: 2, perPage: 50 }, ctx);

    expect(getBudgets).toHaveBeenCalledWith({
      page: 2,
      perPage: 50,
      filter: { project_id: '100' },
    });
  });

  it('uses default pagination', async () => {
    const getBudgets = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getBudgets } });

    await listBudgets({}, ctx);

    expect(getBudgets).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 100 }));
  });

  it('returns data and meta', async () => {
    const getBudgets = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getBudgets } });

    const result = await listBudgets({}, ctx);

    expect(result.data).toEqual(mockResponse.data);
    expect(result.meta).toEqual(mockResponse.meta);
  });
});
