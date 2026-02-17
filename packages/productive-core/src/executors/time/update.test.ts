import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from './create.js';
import { updateTimeEntry } from './update.js';

describe('updateTimeEntry', () => {
  const mockEntry = {
    id: '42',
    type: 'time_entries' as const,
    attributes: {
      date: '2026-01-15',
      time: 240,
      note: 'Updated',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T11:00:00Z',
    },
  };

  it('updates time', async () => {
    const updateApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const ctx = createTestExecutorContext({ api: { updateTimeEntry: updateApi } });

    const result = await updateTimeEntry({ id: '42', time: 240 }, ctx);

    expect(updateApi).toHaveBeenCalledWith('42', { time: 240 });
    expect(result.data).toEqual(mockEntry);
  });

  it('updates date', async () => {
    const updateApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const ctx = createTestExecutorContext({ api: { updateTimeEntry: updateApi } });

    await updateTimeEntry({ id: '42', date: '2026-02-01' }, ctx);

    expect(updateApi).toHaveBeenCalledWith('42', { date: '2026-02-01' });
  });

  it('updates note', async () => {
    const updateApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const ctx = createTestExecutorContext({ api: { updateTimeEntry: updateApi } });

    await updateTimeEntry({ id: '42', note: 'New note' }, ctx);

    expect(updateApi).toHaveBeenCalledWith('42', { note: 'New note' });
  });

  it('updates multiple fields at once', async () => {
    const updateApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const ctx = createTestExecutorContext({ api: { updateTimeEntry: updateApi } });

    await updateTimeEntry({ id: '42', time: 120, note: 'Changed' }, ctx);

    expect(updateApi).toHaveBeenCalledWith('42', { time: 120, note: 'Changed' });
  });

  it('throws ExecutorValidationError when no updates provided', async () => {
    const ctx = createTestExecutorContext();

    await expect(updateTimeEntry({ id: '42' }, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(updateTimeEntry({ id: '42' }, ctx)).rejects.toThrow('No updates specified');
  });
});
