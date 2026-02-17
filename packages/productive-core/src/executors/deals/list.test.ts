import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { buildDealFilters, listDeals } from './list.js';

describe('buildDealFilters', () => {
  it('maps typed options to API filter names', () => {
    const filters = buildDealFilters({
      companyId: '100',
      projectId: '200',
      responsibleId: '300',
      pipelineId: '400',
      status: 'won',
      dealType: 'budget',
      budgetStatus: 'open',
    });
    expect(filters).toEqual({
      company_id: '100',
      project_id: '200',
      responsible_id: '300',
      pipeline_id: '400',
      stage_status_id: '2', // 'won' maps to '2'
      type: '2', // 'budget' maps to '2'
      budget_status: '1', // 'open' maps to '1'
    });
  });

  it('does not set filter for unknown status values', () => {
    const filters = buildDealFilters({ status: 'unknown' });
    expect(filters.stage_status_id).toBeUndefined();
  });

  it('does not set filter for unknown deal type values', () => {
    const filters = buildDealFilters({ dealType: 'unknown' });
    expect(filters.type).toBeUndefined();
  });

  it('does not set filter for unknown budget status values', () => {
    const filters = buildDealFilters({ budgetStatus: 'unknown' });
    expect(filters.budget_status).toBeUndefined();
  });

  it('returns empty filter when no options set', () => {
    const filters = buildDealFilters({});
    expect(filters).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildDealFilters({
      companyId: '100',
      additionalFilters: { custom: 'value' },
    });
    expect(filters.company_id).toBe('100');
    expect(filters.custom).toBe('value');
  });
});

describe('listDeals', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'deals', attributes: { name: 'Deal 1' } }],
    meta: { current_page: 1, total_pages: 1 },
    included: [{ id: '10', type: 'companies', attributes: { name: 'Acme' } }],
  };

  it('resolves filters through resolver', async () => {
    const getDeals = vi.fn().mockResolvedValue(mockResponse);
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { company_id: '100' },
      metadata: { company_id: { original: 'Acme', resolved: '100', type: 'company' } },
    });
    const ctx = createTestExecutorContext({
      api: { getDeals },
      resolver: { resolveFilters },
    });

    const result = await listDeals({ companyId: 'Acme' }, ctx);

    expect(resolveFilters).toHaveBeenCalled();
    expect(result.resolved).toBeDefined();
    expect(result.included).toEqual(mockResponse.included);
  });

  it('uses default include when not specified', async () => {
    const getDeals = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getDeals } });

    await listDeals({}, ctx);

    expect(getDeals).toHaveBeenCalledWith(
      expect.objectContaining({
        include: ['company', 'deal_status', 'responsible'],
      }),
    );
  });

  it('uses custom include when specified', async () => {
    const getDeals = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getDeals } });

    await listDeals({ include: ['company'] }, ctx);

    expect(getDeals).toHaveBeenCalledWith(
      expect.objectContaining({
        include: ['company'],
      }),
    );
  });
});
