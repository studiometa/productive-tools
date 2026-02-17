import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { startTimer, stopTimer } from '../index.js';

describe('startTimer', () => {
  const mockTimer = {
    id: '999',
    type: 'timers' as const,
    attributes: {
      started_at: '2026-01-15T10:00:00Z',
      stopped_at: null,
      total_time: 0,
    },
  };

  it('starts a timer with serviceId', async () => {
    const startTimerApi = vi.fn().mockResolvedValue({ data: mockTimer });
    const ctx = createTestExecutorContext({ api: { startTimer: startTimerApi } });

    const result = await startTimer({ serviceId: '100' }, ctx);

    expect(startTimerApi).toHaveBeenCalledWith({
      service_id: '100',
      time_entry_id: undefined,
    });
    expect(result.data).toEqual(mockTimer);
  });

  it('starts a timer with timeEntryId', async () => {
    const startTimerApi = vi.fn().mockResolvedValue({ data: mockTimer });
    const ctx = createTestExecutorContext({ api: { startTimer: startTimerApi } });

    await startTimer({ timeEntryId: '200' }, ctx);

    expect(startTimerApi).toHaveBeenCalledWith({
      service_id: undefined,
      time_entry_id: '200',
    });
  });
});

describe('stopTimer', () => {
  const mockTimer = {
    id: '999',
    type: 'timers' as const,
    attributes: {
      started_at: '2026-01-15T10:00:00Z',
      stopped_at: '2026-01-15T11:30:00Z',
      total_time: 90,
    },
  };

  it('stops a timer by ID', async () => {
    const stopTimerApi = vi.fn().mockResolvedValue({ data: mockTimer });
    const ctx = createTestExecutorContext({ api: { stopTimer: stopTimerApi } });

    const result = await stopTimer({ id: '999' }, ctx);

    expect(stopTimerApi).toHaveBeenCalledWith('999');
    expect(result.data).toEqual(mockTimer);
  });
});
