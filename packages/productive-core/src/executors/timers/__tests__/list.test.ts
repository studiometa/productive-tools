import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { buildTimerFilters, listTimers } from '../list.js';

describe('buildTimerFilters', () => {
  it('maps personId to person_id', () => {
    const filters = buildTimerFilters({ personId: '100' });
    expect(filters).toEqual({ person_id: '100' });
  });

  it('returns empty filter when no options set', () => {
    const filters = buildTimerFilters({});
    expect(filters).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildTimerFilters({
      personId: '100',
      additionalFilters: { time_entry_id: '200' },
    });
    expect(filters).toEqual({ person_id: '100', time_entry_id: '200' });
  });
});

describe('listTimers', () => {
  const mockResponse = {
    data: [
      {
        id: '1',
        type: 'timers',
        attributes: { started_at: '2026-01-15T10:00:00Z', total_time: 60 },
      },
    ],
    meta: { current_page: 1, total_pages: 1 },
    included: [],
  };

  it('passes include, sort, and filters to API', async () => {
    const getTimers = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getTimers } });

    const result = await listTimers(
      {
        personId: '100',
        include: ['time_entry'],
        sort: '-started_at',
        page: 1,
        perPage: 50,
      },
      ctx,
    );

    expect(getTimers).toHaveBeenCalledWith({
      filter: { person_id: '100' },
      include: ['time_entry'],
      sort: '-started_at',
      page: 1,
      perPage: 50,
    });
    expect(result.data).toEqual(mockResponse.data);
    expect(result.meta).toEqual(mockResponse.meta);
  });

  it('uses defaults when no pagination specified', async () => {
    const getTimers = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getTimers } });

    await listTimers({}, ctx);

    expect(getTimers).toHaveBeenCalledWith({
      filter: {},
      include: undefined,
      sort: undefined,
      page: 1,
      perPage: 100,
    });
  });
});
