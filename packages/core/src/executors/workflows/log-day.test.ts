import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../errors.js';
import { logDay } from './log-day.js';

function mockTimeEntryResponse(id: string) {
  return {
    data: {
      id,
      type: 'time_entries',
      attributes: { time: 120, date: '2026-02-22', note: 'Work done' },
      relationships: {},
    },
  };
}

describe('logDay', () => {
  const baseEntries = [
    { project_id: '100', service_id: '111', duration_minutes: 120, note: 'Frontend dev' },
    { project_id: '200', service_id: '222', duration_minutes: 60, note: 'Code review' },
  ];

  it('throws ExecutorValidationError when entries is empty', async () => {
    const ctx = createTestExecutorContext();
    await expect(logDay({ entries: [] }, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(logDay({ entries: [] }, ctx)).rejects.toThrow('entries is required');
  });

  it('throws ExecutorValidationError when personId is missing and no userId in config', async () => {
    const ctx = createTestExecutorContext({
      config: { userId: undefined, organizationId: 'org-1' },
    });
    await expect(logDay({ entries: baseEntries }, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(logDay({ entries: baseEntries }, ctx)).rejects.toThrow('personId is required');
  });

  it('creates time entries in parallel', async () => {
    const createTimeEntry = vi
      .fn()
      .mockResolvedValueOnce(mockTimeEntryResponse('te-1'))
      .mockResolvedValueOnce(mockTimeEntryResponse('te-2'));

    const ctx = createTestExecutorContext({
      api: { createTimeEntry },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await logDay({ entries: baseEntries }, ctx);

    expect(createTimeEntry).toHaveBeenCalledTimes(2);
    expect(result.data.workflow).toBe('log_day');
    expect(result.data.total_entries).toBe(2);
    expect(result.data.succeeded).toBe(2);
    expect(result.data.failed).toBe(0);
    expect(result.data.total_minutes_logged).toBe(180); // 120 + 60
    expect(result.data.entries).toHaveLength(2);
  });

  it('uses context userId as default person', async () => {
    const createTimeEntry = vi.fn().mockResolvedValue(mockTimeEntryResponse('te-1'));
    const ctx = createTestExecutorContext({
      api: { createTimeEntry },
      config: { userId: 'user-123', organizationId: 'org-1' },
    });

    await logDay({ entries: [baseEntries[0]] }, ctx);

    expect(createTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({ person_id: 'user-123' }),
    );
  });

  it('uses personId option when provided', async () => {
    const createTimeEntry = vi.fn().mockResolvedValue(mockTimeEntryResponse('te-1'));
    const ctx = createTestExecutorContext({
      api: { createTimeEntry },
      config: { userId: 'user-123', organizationId: 'org-1' },
    });

    await logDay({ entries: [baseEntries[0]], personId: 'person-456' }, ctx);

    expect(createTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({ person_id: 'person-456' }),
    );
  });

  it('uses default date for entries without explicit date', async () => {
    const createTimeEntry = vi.fn().mockResolvedValue(mockTimeEntryResponse('te-1'));
    const ctx = createTestExecutorContext({ api: { createTimeEntry } });

    const defaultDate = '2026-02-22';
    await logDay({ entries: [baseEntries[0]], date: defaultDate }, ctx);

    expect(createTimeEntry).toHaveBeenCalledWith(expect.objectContaining({ date: defaultDate }));
  });

  it('per-entry date overrides default date', async () => {
    const createTimeEntry = vi.fn().mockResolvedValue(mockTimeEntryResponse('te-1'));
    const ctx = createTestExecutorContext({ api: { createTimeEntry } });

    const entryWithDate = { ...baseEntries[0], date: '2026-02-20' };
    await logDay({ entries: [entryWithDate], date: '2026-02-22' }, ctx);

    expect(createTimeEntry).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-02-20' }));
  });

  it('isolates individual entry failures as partial results', async () => {
    const createTimeEntry = vi
      .fn()
      .mockResolvedValueOnce(mockTimeEntryResponse('te-1'))
      .mockRejectedValueOnce(new Error('Service not found'));

    const ctx = createTestExecutorContext({ api: { createTimeEntry } });

    const result = await logDay({ entries: baseEntries }, ctx);

    expect(result.data.succeeded).toBe(1);
    expect(result.data.failed).toBe(1);
    expect(result.data.total_minutes_logged).toBe(120); // only first succeeded
    expect(result.data.entries[0].success).toBe(true);
    expect(result.data.entries[1].success).toBe(false);
    expect(result.data.entries[1].error).toContain('Service not found');
  });

  it('resolves service IDs through context resolver', async () => {
    const createTimeEntry = vi.fn().mockResolvedValue(mockTimeEntryResponse('te-1'));
    const resolveValue = vi.fn().mockResolvedValue('service-resolved-id');
    const ctx = createTestExecutorContext({
      api: { createTimeEntry },
      resolver: { resolveValue },
    });

    await logDay({ entries: [baseEntries[0]] }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('111', 'service', { projectId: '100' });
    expect(createTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({ service_id: 'service-resolved-id' }),
    );
  });

  it('returns correct summary fields', async () => {
    const createTimeEntry = vi.fn().mockResolvedValue(mockTimeEntryResponse('te-1'));
    const ctx = createTestExecutorContext({ api: { createTimeEntry } });

    const today = new Date().toISOString().split('T')[0];
    const result = await logDay({ entries: [baseEntries[0]] }, ctx);

    expect(result.data.date).toBe(today);
    expect(result.data.person_id).toBe('test-user-123'); // from defaultTestConfig
    expect(result.data.entries[0].index).toBe(0);
    expect(result.data.entries[0].service_id).toBe('111');
    expect(result.data.entries[0].project_id).toBe('100');
    expect(result.data.entries[0].duration_minutes).toBe(120);
  });

  it('handles all entries failing', async () => {
    const createTimeEntry = vi.fn().mockRejectedValue(new Error('API error'));
    const ctx = createTestExecutorContext({ api: { createTimeEntry } });

    const result = await logDay({ entries: baseEntries }, ctx);

    expect(result.data.succeeded).toBe(0);
    expect(result.data.failed).toBe(2);
    expect(result.data.total_minutes_logged).toBe(0);
    expect(result.data.entries.every((e) => !e.success)).toBe(true);
  });
});
