import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { buildCompanyFilters, listCompanies } from './list.js';

describe('buildCompanyFilters', () => {
  it('defaults to active companies (status 1)', () => {
    const filters = buildCompanyFilters({});
    expect(filters.status).toBe('1');
  });

  it('sets status to 1 for archived=false', () => {
    const filters = buildCompanyFilters({ archived: false });
    expect(filters.status).toBe('1');
  });

  it('sets status to 2 for archived=true', () => {
    const filters = buildCompanyFilters({ archived: true });
    expect(filters.status).toBe('2');
  });

  it('merges additionalFilters', () => {
    const filters = buildCompanyFilters({
      additionalFilters: { custom: 'value' },
    });
    expect(filters.custom).toBe('value');
    expect(filters.status).toBe('1');
  });
});

describe('listCompanies', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'companies', attributes: { name: 'Acme' } }],
    meta: { current_page: 1, total_pages: 1 },
  };

  it('passes filters, pagination, and sort to API', async () => {
    const getCompanies = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCompanies } });

    await listCompanies({ page: 2, perPage: 50, sort: 'name' }, ctx);

    expect(getCompanies).toHaveBeenCalledWith({
      page: 2,
      perPage: 50,
      filter: { status: '1' },
      sort: 'name',
    });
  });

  it('uses default pagination', async () => {
    const getCompanies = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCompanies } });

    await listCompanies({}, ctx);

    expect(getCompanies).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 100 }));
  });

  it('returns data and meta', async () => {
    const getCompanies = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCompanies } });

    const result = await listCompanies({}, ctx);

    expect(result.data).toEqual(mockResponse.data);
    expect(result.meta).toEqual(mockResponse.meta);
  });
});
