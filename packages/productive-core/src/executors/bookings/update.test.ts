import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { ExecutorValidationError } from './../time/create.js';
import { updateBooking } from './update.js';

describe('updateBooking', () => {
  const mockBooking = {
    id: '1',
    type: 'bookings' as const,
    attributes: { started_on: '2026-01-15', ended_on: '2026-01-20' },
  };

  it('updates booking with provided fields', async () => {
    const updateBookingApi = vi.fn().mockResolvedValue({ data: mockBooking });
    const ctx = createTestExecutorContext({
      api: { updateBooking: updateBookingApi },
    });

    const result = await updateBooking(
      { id: '1', startedOn: '2026-01-15', endedOn: '2026-01-20' },
      ctx,
    );

    expect(updateBookingApi).toHaveBeenCalledWith('1', {
      started_on: '2026-01-15',
      ended_on: '2026-01-20',
    });
    expect(result.data).toEqual(mockBooking);
  });

  it('only sends changed fields', async () => {
    const updateBookingApi = vi.fn().mockResolvedValue({ data: mockBooking });
    const ctx = createTestExecutorContext({
      api: { updateBooking: updateBookingApi },
    });

    await updateBooking({ id: '1', note: 'Updated note' }, ctx);

    expect(updateBookingApi).toHaveBeenCalledWith('1', { note: 'Updated note' });
  });

  it('supports time and percentage fields', async () => {
    const updateBookingApi = vi.fn().mockResolvedValue({ data: mockBooking });
    const ctx = createTestExecutorContext({
      api: { updateBooking: updateBookingApi },
    });

    await updateBooking({ id: '1', time: 240, percentage: 50 }, ctx);

    expect(updateBookingApi).toHaveBeenCalledWith('1', { time: 240, percentage: 50 });
  });

  it('throws ExecutorValidationError when no fields provided', async () => {
    const ctx = createTestExecutorContext();

    await expect(updateBooking({ id: '1' }, ctx)).rejects.toThrow(ExecutorValidationError);
  });
});
