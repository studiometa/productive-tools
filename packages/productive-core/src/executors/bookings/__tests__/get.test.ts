import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { getBooking } from '../get.js';

describe('getBooking', () => {
  const mockBooking = {
    id: '1',
    type: 'bookings' as const,
    attributes: { started_on: '2026-01-15', ended_on: '2026-01-16' },
  };

  it('fetches a booking by ID', async () => {
    const getBookingApi = vi.fn().mockResolvedValue({ data: mockBooking });
    const ctx = createTestExecutorContext({
      api: { getBooking: getBookingApi },
    });

    const result = await getBooking({ id: '1' }, ctx);

    expect(getBookingApi).toHaveBeenCalledWith('1', { include: undefined });
    expect(result.data).toEqual(mockBooking);
  });
});
