import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { stopTimer } from '../stop.js';

describe('stopTimer', () => {
  const mockTimer = {
    id: '1',
    type: 'timers' as const,
    attributes: { started_at: '2026-01-15T10:00:00Z', ended_at: '2026-01-15T12:00:00Z' },
  };

  it('stops a timer by ID', async () => {
    const stopTimerApi = vi.fn().mockResolvedValue({ data: mockTimer });
    const ctx = createTestExecutorContext({
      api: { stopTimer: stopTimerApi },
    });

    const result = await stopTimer({ id: '1' }, ctx);

    expect(stopTimerApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual(mockTimer);
  });
});
