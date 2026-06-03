import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { listCustomFields } from './list.js';

const mockResponse = {
  data: [
    {
      id: '42236',
      type: 'custom_fields',
      attributes: {
        name: 'Semaine',
        data_type_id: 3,
        customizable_type: 'Task',
        archived: false,
        required: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
      },
    },
    {
      id: '41487',
      type: 'custom_fields',
      attributes: {
        name: 'Priority',
        data_type_id: 2,
        customizable_type: 'Task',
        archived: false,
        required: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
      },
    },
  ],
  meta: { current_page: 1, total_pages: 1, total_count: 2 },
  included: [],
};

describe('listCustomFields', () => {
  it('calls getCustomFields with default pagination', async () => {
    const getCustomFields = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCustomFields } });

    await listCustomFields({}, ctx);

    expect(getCustomFields).toHaveBeenCalledWith({
      page: 1,
      perPage: 100,
      filter: undefined,
      include: undefined,
    });
  });

  it('passes custom pagination', async () => {
    const getCustomFields = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCustomFields } });

    await listCustomFields({ page: 2, perPage: 50 }, ctx);

    expect(getCustomFields).toHaveBeenCalledWith(expect.objectContaining({ page: 2, perPage: 50 }));
  });

  it('passes customizable_type filter', async () => {
    const getCustomFields = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCustomFields } });

    await listCustomFields({ customizable_type: 'Task' }, ctx);

    expect(getCustomFields).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { customizable_type: 'Task' } }),
    );
  });

  it('passes archived filter', async () => {
    const getCustomFields = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCustomFields } });

    await listCustomFields({ archived: false }, ctx);

    expect(getCustomFields).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { archived: 'false' } }),
    );
  });

  it('merges additionalFilters with typed filters', async () => {
    const getCustomFields = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCustomFields } });

    await listCustomFields(
      { customizable_type: 'Task', additionalFilters: { name: 'Semaine' } },
      ctx,
    );

    expect(getCustomFields).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { customizable_type: 'Task', name: 'Semaine' },
      }),
    );
  });

  it('passes include option', async () => {
    const getCustomFields = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCustomFields } });

    await listCustomFields({ include: ['options'] }, ctx);

    expect(getCustomFields).toHaveBeenCalledWith(expect.objectContaining({ include: ['options'] }));
  });

  it('returns data, meta, and included from response', async () => {
    const getCustomFields = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getCustomFields } });

    const result = await listCustomFields({}, ctx);

    expect(result.data).toHaveLength(2);
    expect(result.data[0].attributes.name).toBe('Semaine');
    expect(result.meta?.current_page).toBe(1);
    expect(result.included).toHaveLength(0);
  });

  it('sends no filter key when no filters provided', async () => {
    const getCustomFields = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const ctx = createTestExecutorContext({ api: { getCustomFields } });

    await listCustomFields({}, ctx);

    expect(getCustomFields).toHaveBeenCalledWith(expect.objectContaining({ filter: undefined }));
  });
});
