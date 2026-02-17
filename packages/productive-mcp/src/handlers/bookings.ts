/**
 * Bookings MCP handler.
 */

import {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
} from '@studiometa/productive-core';

import type { BookingArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatBooking, formatListResponse } from '../formatters.js';
import { getBookingHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'create', 'update'];

export async function handleBookings(
  action: string,
  args: BookingArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, person_id, service_id, event_id, started_on, ended_on, time, note } = args;
  const include = userInclude?.length
    ? [...new Set(['person', 'service', ...userInclude])]
    : ['person', 'service'];

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await getBooking({ id, include }, execCtx);
    const formatted = formatBooking(result.data, { ...formatOptions, included: result.included });

    if (ctx.includeHints !== false) {
      const personId = result.data.relationships?.person?.data?.id;
      return jsonResult({ ...formatted, _hints: getBookingHints(id, personId) });
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
    const result = await createBooking(
      {
        personId: person_id,
        serviceId: service_id ?? '',
        startedOn: started_on,
        endedOn: ended_on,
        time,
        note,
        eventId: event_id,
      },
      execCtx,
    );
    return jsonResult({ success: true, ...formatBooking(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const result = await updateBooking(
      {
        id,
        startedOn: started_on,
        endedOn: ended_on,
        time,
        note,
      },
      execCtx,
    );
    return jsonResult({ success: true, ...formatBooking(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await listBookings(
      { page, perPage, additionalFilters: filter, include },
      execCtx,
    );
    return jsonResult(formatListResponse(result.data, formatBooking, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'bookings', VALID_ACTIONS));
}
