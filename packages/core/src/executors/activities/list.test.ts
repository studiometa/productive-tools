import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { listActivities } from './list.js';

const mockResponse = {
  data: [
    {
      id: '1',
      type: 'activities',
      attributes: {
        event: 'create',
        changeset: [{ name: [null, 'My Project'] }],
        created_at: '2026-02-22T10:00:00Z',
      },
      relationships: {
        creator: { data: { type: 'people', id: '42' } },
      },
    },
  ],
  meta: { current_page: 1, total_pages: 1, total_count: 1 },
  included: [
    {
      id: '42',
      type: 'people',
      attributes: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
    },
  ],
};

describe('listActivities', () => {
  it('calls getActivities with default pagination', async () => {
    const getActivities = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getActivities } });

    await listActivities({}, ctx);

    expect(getActivities).toHaveBeenCalledWith({
      page: 1,
      perPage: 100,
      filter: undefined,
      include: undefined,
    });
  });

  it('passes custom pagination', async () => {
    const getActivities = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getActivities } });

    await listActivities({ page: 2, perPage: 50 }, ctx);

    expect(getActivities).toHaveBeenCalledWith(expect.objectContaining({ page: 2, perPage: 50 }));
  });

  it('passes filters from additionalFilters', async () => {
    const getActivities = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getActivities } });

    await listActivities(
      { additionalFilters: { event: 'create', after: '2026-01-01T00:00:00Z' } },
      ctx,
    );

    expect(getActivities).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { event: 'create', after: '2026-01-01T00:00:00Z' },
      }),
    );
  });

  it('passes include option', async () => {
    const getActivities = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getActivities } });

    await listActivities({ include: ['creator'] }, ctx);

    expect(getActivities).toHaveBeenCalledWith(expect.objectContaining({ include: ['creator'] }));
  });

  it('returns data, meta, and included from response', async () => {
    const getActivities = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getActivities } });

    const result = await listActivities({}, ctx);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].attributes.event).toBe('create');
    expect(result.meta?.current_page).toBe(1);
    expect(result.included).toHaveLength(1);
  });

  it('sends no filter key when additionalFilters is empty', async () => {
    const getActivities = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const ctx = createTestExecutorContext({ api: { getActivities } });

    await listActivities({ additionalFilters: {} }, ctx);

    expect(getActivities).toHaveBeenCalledWith(expect.objectContaining({ filter: undefined }));
  });
});
