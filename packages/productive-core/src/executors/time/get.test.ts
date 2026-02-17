import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getTimeEntry } from './get.js';

describe('getTimeEntry', () => {
  it('returns the time entry from API', async () => {
    const mockEntry = {
      id: '42',
      type: 'time_entries' as const,
      attributes: {
        date: '2026-01-15',
        time: 480,
        note: 'Work',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
    };

    const getTimeEntryApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const ctx = createTestExecutorContext({ api: { getTimeEntry: getTimeEntryApi } });

    const result = await getTimeEntry({ id: '42' }, ctx);

    expect(getTimeEntryApi).toHaveBeenCalledWith('42');
    expect(result.data).toEqual(mockEntry);
    expect(result.meta).toBeUndefined();
  });
});
