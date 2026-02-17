import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { createBooking } from '../create.js';

describe('createBooking', () => {
  const mockBooking = {
    id: '1',
    type: 'bookings' as const,
    attributes: { started_on: '2026-01-15', ended_on: '2026-01-16' },
  };

  it('resolves person and service IDs before creating', async () => {
    const createBookingApi = vi.fn().mockResolvedValue({ data: mockBooking });
    const resolveValue = vi
      .fn()
      .mockResolvedValueOnce('100') // person
      .mockResolvedValueOnce('200'); // service
    const ctx = createTestExecutorContext({
      api: { createBooking: createBookingApi },
      resolver: { resolveValue },
    });

    const result = await createBooking(
      {
        personId: 'john@test.com',
        serviceId: 'Development',
        startedOn: '2026-01-15',
        endedOn: '2026-01-16',
      },
      ctx,
    );

    expect(resolveValue).toHaveBeenCalledWith('john@test.com', 'person');
    expect(resolveValue).toHaveBeenCalledWith('Development', 'service');
    expect(createBookingApi).toHaveBeenCalledWith({
      person_id: '100',
      service_id: '200',
      started_on: '2026-01-15',
      ended_on: '2026-01-16',
      time: undefined,
      percentage: undefined,
      booking_method_id: undefined,
      note: undefined,
      event_id: undefined,
    });
    expect(result.data).toEqual(mockBooking);
  });

  it('passes optional fields', async () => {
    const createBookingApi = vi.fn().mockResolvedValue({ data: mockBooking });
    const ctx = createTestExecutorContext({
      api: { createBooking: createBookingApi },
    });

    await createBooking(
      {
        personId: '100',
        serviceId: '200',
        startedOn: '2026-01-15',
        endedOn: '2026-01-16',
        time: 480,
        percentage: 100,
        bookingMethodId: 1,
        note: 'Sprint planning',
        eventId: '300',
      },
      ctx,
    );

    expect(createBookingApi).toHaveBeenCalledWith(
      expect.objectContaining({
        time: 480,
        percentage: 100,
        booking_method_id: 1,
        note: 'Sprint planning',
        event_id: '300',
      }),
    );
  });
});
