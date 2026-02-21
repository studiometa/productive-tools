import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getDealContext } from './context.js';

describe('getDealContext', () => {
  const mockDeal = {
    id: '1',
    type: 'deals' as const,
    attributes: { name: 'Big Deal' },
  };
  const mockServices = [
    { id: 's1', type: 'services' as const, attributes: { name: 'Consulting' } },
    { id: 's2', type: 'services' as const, attributes: { name: 'Development' } },
  ];
  const mockComments = [{ id: 'c1', type: 'comments' as const, attributes: { body: 'Comment 1' } }];
  const mockTimeEntries = [
    { id: 'te1', type: 'time_entries' as const, attributes: { time: 480, date: '2024-01-15' } },
    { id: 'te2', type: 'time_entries' as const, attributes: { time: 240, date: '2024-01-14' } },
  ];
  const mockDealIncluded = [{ id: '10', type: 'companies', attributes: { name: 'Acme Corp' } }];
  const mockCommentIncluded = [{ id: '20', type: 'people', attributes: { name: 'Creator' } }];

  it('fetches deal with all related data in parallel', async () => {
    const getDealApi = vi.fn().mockResolvedValue({ data: mockDeal, included: mockDealIncluded });
    const getServicesApi = vi.fn().mockResolvedValue({ data: mockServices });
    const getCommentsApi = vi
      .fn()
      .mockResolvedValue({ data: mockComments, included: mockCommentIncluded });
    const getTimeEntriesApi = vi.fn().mockResolvedValue({ data: mockTimeEntries });

    const ctx = createTestExecutorContext({
      api: {
        getDeal: getDealApi,
        getServices: getServicesApi,
        getComments: getCommentsApi,
        getTimeEntries: getTimeEntriesApi,
      },
    });

    const result = await getDealContext({ id: '1' }, ctx);

    // Verify all APIs were called with correct parameters
    expect(getDealApi).toHaveBeenCalledWith('1', {
      include: ['company', 'deal_status', 'responsible', 'project'],
    });
    expect(getServicesApi).toHaveBeenCalledWith({
      filter: { deal_id: '1' },
      perPage: 20,
    });
    expect(getCommentsApi).toHaveBeenCalledWith({
      filter: { deal_id: '1' },
      perPage: 20,
      include: ['creator'],
    });
    expect(getTimeEntriesApi).toHaveBeenCalledWith({
      filter: { deal_id: '1' },
      perPage: 20,
      sort: '-date',
    });

    // Verify result structure
    expect(result.data.deal).toEqual(mockDeal);
    expect(result.data.services).toEqual(mockServices);
    expect(result.data.comments).toEqual(mockComments);
    expect(result.data.time_entries).toEqual(mockTimeEntries);

    // Verify included resources are merged
    expect(result.included).toEqual([...mockDealIncluded, ...mockCommentIncluded]);
  });

  it('resolves human-friendly deal ID before fetching', async () => {
    const getDealApi = vi.fn().mockResolvedValue({ data: mockDeal, included: [] });
    const getServicesApi = vi.fn().mockResolvedValue({ data: [] });
    const getCommentsApi = vi.fn().mockResolvedValue({ data: [] });
    const getTimeEntriesApi = vi.fn().mockResolvedValue({ data: [] });
    const resolveValue = vi.fn().mockResolvedValue('1');

    const ctx = createTestExecutorContext({
      api: {
        getDeal: getDealApi,
        getServices: getServicesApi,
        getComments: getCommentsApi,
        getTimeEntries: getTimeEntriesApi,
      },
      resolver: { resolveValue },
    });

    await getDealContext({ id: 'D-999' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('D-999', 'deal');
    expect(getDealApi).toHaveBeenCalledWith('1', expect.any(Object));
    expect(getServicesApi).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { deal_id: '1' },
      }),
    );
  });

  it('handles empty related data gracefully', async () => {
    const getDealApi = vi.fn().mockResolvedValue({ data: mockDeal });
    const getServicesApi = vi.fn().mockResolvedValue({ data: [] });
    const getCommentsApi = vi.fn().mockResolvedValue({ data: [] });
    const getTimeEntriesApi = vi.fn().mockResolvedValue({ data: [] });

    const ctx = createTestExecutorContext({
      api: {
        getDeal: getDealApi,
        getServices: getServicesApi,
        getComments: getCommentsApi,
        getTimeEntries: getTimeEntriesApi,
      },
    });

    const result = await getDealContext({ id: '1' }, ctx);

    expect(result.data.deal).toEqual(mockDeal);
    expect(result.data.services).toEqual([]);
    expect(result.data.comments).toEqual([]);
    expect(result.data.time_entries).toEqual([]);
    expect(result.included).toEqual([]);
  });

  it('executes all API calls in parallel (not sequentially)', async () => {
    const callOrder: string[] = [];

    const getDealApi = vi.fn(async () => {
      callOrder.push('getDeal-start');
      await Promise.resolve();
      callOrder.push('getDeal-end');
      return { data: mockDeal, included: [] };
    });
    const getServicesApi = vi.fn(async () => {
      callOrder.push('getServices-start');
      await Promise.resolve();
      callOrder.push('getServices-end');
      return { data: [] };
    });
    const getCommentsApi = vi.fn(async () => {
      callOrder.push('getComments-start');
      await Promise.resolve();
      callOrder.push('getComments-end');
      return { data: [] };
    });
    const getTimeEntriesApi = vi.fn(async () => {
      callOrder.push('getTimeEntries-start');
      await Promise.resolve();
      callOrder.push('getTimeEntries-end');
      return { data: [] };
    });

    const ctx = createTestExecutorContext({
      api: {
        getDeal: getDealApi,
        getServices: getServicesApi,
        getComments: getCommentsApi,
        getTimeEntries: getTimeEntriesApi,
      },
    });

    await getDealContext({ id: '1' }, ctx);

    // All start calls should happen before end calls (parallel execution)
    const startCalls = callOrder.filter((c) => c.endsWith('-start'));
    expect(startCalls.length).toBe(4);
  });
});
