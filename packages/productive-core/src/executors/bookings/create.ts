import type { ProductiveBooking } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CreateBookingOptions } from './types.js';

export async function createBooking(
  options: CreateBookingOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveBooking>> {
  const personId = await ctx.resolver.resolveValue(options.personId, 'person');
  const serviceId = options.serviceId
    ? await ctx.resolver.resolveValue(options.serviceId, 'service')
    : undefined;

  const response = await ctx.api.createBooking({
    person_id: personId,
    service_id: serviceId,
    started_on: options.startedOn,
    ended_on: options.endedOn,
    time: options.time,
    total_time: options.totalTime,
    percentage: options.percentage,
    booking_method_id: options.bookingMethodId,
    draft: options.draft,
    note: options.note,
    event_id: options.eventId,
  });

  return { data: response.data };
}
