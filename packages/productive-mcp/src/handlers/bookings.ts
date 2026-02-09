/**
 * Bookings resource handler
 */

import type { BookingArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatBooking, formatListResponse } from '../formatters.js';
import { getBookingHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

/** Default includes for bookings */
const DEFAULT_BOOKING_INCLUDE = ['person', 'service'];
const VALID_ACTIONS = ['list', 'get', 'create', 'update'];

export async function handleBookings(
  action: string,
  args: BookingArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, person_id, service_id, event_id, started_on, ended_on, time, note } = args;
  // Merge default includes with user-provided includes
  const include = userInclude?.length
    ? [...new Set([...DEFAULT_BOOKING_INCLUDE, ...userInclude])]
    : DEFAULT_BOOKING_INCLUDE;

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await api.getBooking(id, { include });
    const formatted = formatBooking(result.data, {
      ...formatOptions,
      included: result.included,
    });

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      const personId = result.data.relationships?.person?.data?.id;
      return jsonResult({
        ...formatted,
        _hints: getBookingHints(id, personId),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!person_id || !started_on || !ended_on) {
      return inputErrorResult(
        ErrorMessages.missingRequiredFields('booking', ['person_id', 'started_on', 'ended_on']),
      );
    }
    if (!service_id && !event_id) {
      return inputErrorResult(ErrorMessages.missingBookingTarget());
    }
    const result = await api.createBooking({
      person_id,
      service_id,
      event_id,
      started_on,
      ended_on,
      time,
      note,
    });
    return jsonResult({ success: true, ...formatBooking(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const updateData: Parameters<typeof api.updateBooking>[1] = {};
    if (started_on !== undefined) updateData.started_on = started_on;
    if (ended_on !== undefined) updateData.ended_on = ended_on;
    if (time !== undefined) updateData.time = time;
    if (note !== undefined) updateData.note = note;
    const result = await api.updateBooking(id, updateData);
    return jsonResult({ success: true, ...formatBooking(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getBookings({ filter, page, perPage, include });
    return jsonResult(
      formatListResponse(result.data, formatBooking, result.meta, {
        ...formatOptions,
        included: result.included,
      }),
    );
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'bookings', VALID_ACTIONS));
}
