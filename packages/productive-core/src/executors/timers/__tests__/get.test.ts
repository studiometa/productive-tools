import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { getTimer } from '../get.js';

describe('getTimer', () => {
  const mockTimer = {
    id: '123',
    type: 'timers' as const,
    attributes: {
      started_at: '2026-01-15T10:00:00Z',
      stopped_at: '2026-01-15T11:30:00Z',
      total_time: 90,
    },
  };

  it('fetches a timer by ID', async () => {
    const getTimerApi = vi.fn().mockResolvedValue({ data: mockTimer });
    const ctx = createTestExecutorContext({ api: { getTimer: getTimerApi } });

    const result = await getTimer({ id: '123' }, ctx);

    expect(getTimerApi).toHaveBeenCalledWith('123', { include: undefined });
    expect(result.data).toEqual(mockTimer);
  });
});
