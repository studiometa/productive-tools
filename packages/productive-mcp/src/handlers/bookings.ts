/**
 * Bookings MCP handler.
 */

import { fromHandlerContext, listBookings } from '@studiometa/productive-core';

import type { BookingArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatBooking, formatListResponse } from '../formatters.js';
import { getBookingHints } from '../hints.js';
import { resolveFilters, resolveFilterValue, isNumericId } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const resolveFns = { resolveFilterValue, resolveFilters, isNumericId };

const VALID_ACTIONS = ['list', 'get', 'create', 'update'];

export async function handleBookings(
  action: string,
  args: BookingArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, person_id, service_id, event_id, started_on, ended_on, time, note } = args;
  const include = userInclude?.length
    ? [...new Set(['person', 'service', ...userInclude])]
    : ['person', 'service'];

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    // Use API directly to preserve include handling
    const result = await api.getBooking(id, { include });
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
    const execCtx = fromHandlerContext(ctx, resolveFns);
    const result = await listBookings(
      { page, perPage, additionalFilters: filter, include },
      execCtx,
    );
    return jsonResult(formatListResponse(result.data, formatBooking, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'bookings', VALID_ACTIONS));
}
