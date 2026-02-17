import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { buildTimeEntryFilters, listTimeEntries } from './list.js';

describe('buildTimeEntryFilters', () => {
  it('returns empty object for empty options', () => {
    expect(buildTimeEntryFilters({})).toEqual({});
  });

  it('maps date range options', () => {
    const result = buildTimeEntryFilters({ after: '2026-01-01', before: '2026-01-31' });
    expect(result).toEqual({ after: '2026-01-01', before: '2026-01-31' });
  });

  it('maps resource ID options to filter keys', () => {
    const result = buildTimeEntryFilters({
      personId: '123',
      projectId: '456',
      serviceId: '789',
      taskId: '111',
      companyId: '222',
      dealId: '333',
      budgetId: '444',
    });
    expect(result).toEqual({
      person_id: '123',
      project_id: '456',
      service_id: '789',
      task_id: '111',
      company_id: '222',
      deal_id: '333',
      budget_id: '444',
    });
  });

  it('maps status string to API value', () => {
    expect(buildTimeEntryFilters({ status: 'approved' })).toEqual({ status: '1' });
    expect(buildTimeEntryFilters({ status: 'unapproved' })).toEqual({ status: '2' });
    expect(buildTimeEntryFilters({ status: 'rejected' })).toEqual({ status: '3' });
  });

  it('maps billing type string to API value', () => {
    expect(buildTimeEntryFilters({ billingType: 'fixed' })).toEqual({ billing_type_id: '1' });
    expect(buildTimeEntryFilters({ billingType: 'actuals' })).toEqual({ billing_type_id: '2' });
    expect(buildTimeEntryFilters({ billingType: 'non_billable' })).toEqual({
      billing_type_id: '3',
    });
  });

  it('maps invoicing status string to API value', () => {
    expect(buildTimeEntryFilters({ invoicingStatus: 'not_invoiced' })).toEqual({
      invoicing_status: '1',
    });
    expect(buildTimeEntryFilters({ invoicingStatus: 'drafted' })).toEqual({
      invoicing_status: '2',
    });
    expect(buildTimeEntryFilters({ invoicingStatus: 'finalized' })).toEqual({
      invoicing_status: '3',
    });
  });

  it('ignores unknown status/billing/invoicing values', () => {
    expect(buildTimeEntryFilters({ status: 'unknown' })).toEqual({});
    expect(buildTimeEntryFilters({ billingType: 'unknown' })).toEqual({});
    expect(buildTimeEntryFilters({ invoicingStatus: 'unknown' })).toEqual({});
  });

  it('is case-insensitive for enum values', () => {
    expect(buildTimeEntryFilters({ status: 'Approved' })).toEqual({ status: '1' });
    expect(buildTimeEntryFilters({ billingType: 'FIXED' })).toEqual({ billing_type_id: '1' });
  });

  it('includes additional raw filters', () => {
    const result = buildTimeEntryFilters({
      personId: '123',
      additionalFilters: { custom_field: 'value' },
    });
    expect(result).toEqual({ person_id: '123', custom_field: 'value' });
  });

  it('specific options override additional filters', () => {
    const result = buildTimeEntryFilters({
      personId: '999',
      additionalFilters: { person_id: '111' },
    });
    expect(result).toEqual({ person_id: '999' });
  });
});

describe('listTimeEntries', () => {
  const mockTimeEntries = [
    {
      id: '1',
      type: 'time_entries' as const,
      attributes: {
        date: '2026-01-15',
        time: 480,
        note: 'Development work',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
    },
  ];

  const mockMeta = { page: 1, per_page: 100, total: 1 };

  it('calls API with default pagination', async () => {
    const getTimeEntries = vi.fn().mockResolvedValue({
      data: mockTimeEntries,
      meta: mockMeta,
    });

    const ctx = createTestExecutorContext({ api: { getTimeEntries } });
    const result = await listTimeEntries({}, ctx);

    expect(getTimeEntries).toHaveBeenCalledWith({
      page: 1,
      perPage: 100,
      filter: {},
      sort: undefined,
    });
    expect(result.data).toEqual(mockTimeEntries);
    expect(result.meta).toEqual(mockMeta);
    expect(result.resolved).toBeUndefined();
  });

  it('passes custom pagination and sort', async () => {
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const ctx = createTestExecutorContext({ api: { getTimeEntries } });

    await listTimeEntries({ page: 3, perPage: 50, sort: '-date' }, ctx);

    expect(getTimeEntries).toHaveBeenCalledWith({
      page: 3,
      perPage: 50,
      filter: {},
      sort: '-date',
    });
  });

  it('builds and resolves filters', async () => {
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { person_id: '500521' },
      metadata: {
        person_id: {
          query: 'user@example.com',
          id: '500521',
          label: 'John Doe',
          type: 'person',
        },
      },
    });

    const ctx = createTestExecutorContext({
      api: { getTimeEntries },
      resolver: { resolveFilters },
    });

    const result = await listTimeEntries({ personId: 'user@example.com' }, ctx);

    expect(resolveFilters).toHaveBeenCalledWith({ person_id: 'user@example.com' });
    expect(getTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { person_id: '500521' } }),
    );
    expect(result.resolved).toEqual({
      person_id: {
        query: 'user@example.com',
        id: '500521',
        label: 'John Doe',
        type: 'person',
      },
    });
  });

  it('omits resolved field when no resolutions occurred', async () => {
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { person_id: '123' },
      metadata: {},
    });

    const ctx = createTestExecutorContext({
      api: { getTimeEntries },
      resolver: { resolveFilters },
    });

    const result = await listTimeEntries({ personId: '123' }, ctx);
    expect(result.resolved).toBeUndefined();
  });
});
