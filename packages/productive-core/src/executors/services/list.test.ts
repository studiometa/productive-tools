import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { buildServicesFilters, listServices } from './list.js';

describe('buildServicesFilters', () => {
  it('maps typed options to API filter names', () => {
    const filters = buildServicesFilters({
      projectId: '100',
      dealId: '200',
      taskId: '300',
      personId: '400',
    });
    expect(filters).toEqual({
      project_id: '100',
      deal_id: '200',
      task_id: '300',
      person_id: '400',
    });
  });

  it('maps budget status to numeric value', () => {
    expect(buildServicesFilters({ budgetStatus: 'open' }).budget_status).toBe('1');
    expect(buildServicesFilters({ budgetStatus: 'delivered' }).budget_status).toBe('2');
  });

  it('maps billing type to numeric value', () => {
    expect(buildServicesFilters({ billingType: 'fixed' }).billing_type).toBe('1');
    expect(buildServicesFilters({ billingType: 'actuals' }).billing_type).toBe('2');
    expect(buildServicesFilters({ billingType: 'none' }).billing_type).toBe('3');
  });

  it('maps time tracking boolean', () => {
    expect(buildServicesFilters({ timeTracking: true }).time_tracking_enabled).toBe('true');
    expect(buildServicesFilters({ timeTracking: false }).time_tracking_enabled).toBe('false');
  });

  it('ignores unknown budget status', () => {
    const filters = buildServicesFilters({ budgetStatus: 'unknown' });
    expect(filters.budget_status).toBeUndefined();
  });

  it('ignores unknown billing type', () => {
    const filters = buildServicesFilters({ billingType: 'unknown' });
    expect(filters.billing_type).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(buildServicesFilters({ budgetStatus: 'Open' }).budget_status).toBe('1');
    expect(buildServicesFilters({ billingType: 'Fixed' }).billing_type).toBe('1');
  });

  it('returns empty filter for empty options', () => {
    expect(buildServicesFilters({})).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildServicesFilters({
      projectId: '100',
      additionalFilters: { custom: 'value' },
    });
    expect(filters.project_id).toBe('100');
    expect(filters.custom).toBe('value');
  });
});

describe('listServices', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'services', attributes: { name: 'Development' } }],
    meta: { current_page: 1, total_pages: 1 },
  };

  it('passes filters and pagination to API', async () => {
    const getServices = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getServices } });

    await listServices({ projectId: '100', page: 2, perPage: 50 }, ctx);

    expect(getServices).toHaveBeenCalledWith({
      page: 2,
      perPage: 50,
      filter: { project_id: '100' },
    });
  });

  it('resolves filter values and returns metadata', async () => {
    const getServices = vi.fn().mockResolvedValue(mockResponse);
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { project_id: '100' },
      metadata: { project_id: { original: 'PRJ-001', resolved: '100', type: 'project' } },
    });
    const ctx = createTestExecutorContext({
      api: { getServices },
      resolver: { resolveFilters },
    });

    const result = await listServices({ projectId: 'PRJ-001' }, ctx);

    expect(result.resolved).toBeDefined();
  });

  it('uses default pagination', async () => {
    const getServices = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getServices } });

    await listServices({}, ctx);

    expect(getServices).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 100 }));
  });
});
