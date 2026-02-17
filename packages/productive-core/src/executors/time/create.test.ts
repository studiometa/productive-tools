import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { createTimeEntry } from './create.js';

describe('createTimeEntry', () => {
  const mockEntry = {
    id: '999',
    type: 'time_entries' as const,
    attributes: {
      date: '2026-01-15',
      time: 480,
      note: 'Dev work',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    },
  };

  it('creates a time entry with resolved IDs', async () => {
    const createTimeEntryApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const resolveValue = vi
      .fn()
      .mockResolvedValueOnce('500521') // person
      .mockResolvedValueOnce('6028361'); // service

    const ctx = createTestExecutorContext({
      api: { createTimeEntry: createTimeEntryApi },
      resolver: { resolveValue },
    });

    const result = await createTimeEntry(
      {
        personId: 'user@example.com',
        serviceId: 'Development',
        time: 480,
        date: '2026-01-15',
        note: 'Dev work',
      },
      ctx,
    );

    expect(resolveValue).toHaveBeenCalledWith('user@example.com', 'person');
    expect(resolveValue).toHaveBeenCalledWith('Development', 'service', { projectId: undefined });
    expect(createTimeEntryApi).toHaveBeenCalledWith({
      person_id: '500521',
      service_id: '6028361',
      time: 480,
      date: '2026-01-15',
      note: 'Dev work',
      task_id: undefined,
    });
    expect(result.data).toEqual(mockEntry);
  });

  it('defaults date to today if not provided', async () => {
    const createTimeEntryApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const ctx = createTestExecutorContext({
      api: { createTimeEntry: createTimeEntryApi },
    });

    await createTimeEntry(
      {
        personId: '123',
        serviceId: '456',
        time: 60,
      },
      ctx,
    );

    const today = new Date().toISOString().split('T')[0];
    expect(createTimeEntryApi).toHaveBeenCalledWith(expect.objectContaining({ date: today }));
  });

  it('passes projectId for service resolution context', async () => {
    const createTimeEntryApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const resolveValue = vi.fn().mockResolvedValue('resolved-id');
    const ctx = createTestExecutorContext({
      api: { createTimeEntry: createTimeEntryApi },
      resolver: { resolveValue },
    });

    await createTimeEntry(
      {
        personId: '123',
        serviceId: 'Development',
        time: 480,
        projectId: '777',
      },
      ctx,
    );

    expect(resolveValue).toHaveBeenCalledWith('Development', 'service', { projectId: '777' });
  });

  it('passes optional taskId', async () => {
    const createTimeEntryApi = vi.fn().mockResolvedValue({ data: mockEntry });
    const ctx = createTestExecutorContext({
      api: { createTimeEntry: createTimeEntryApi },
    });

    await createTimeEntry(
      {
        personId: '123',
        serviceId: '456',
        time: 60,
        taskId: '789',
      },
      ctx,
    );

    expect(createTimeEntryApi).toHaveBeenCalledWith(expect.objectContaining({ task_id: '789' }));
  });
});
