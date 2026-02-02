/**
 * Bookings resource handler
 */

import { formatBooking, formatListResponse } from '../formatters.js';
import type { HandlerContext, BookingArgs, ToolResult } from './types.js';
import { jsonResult, errorResult } from './utils.js';

export async function handleBookings(
  action: string,
  args: BookingArgs,
  ctx: HandlerContext
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, person_id, service_id, event_id, started_on, ended_on, time, note } = args;

  if (action === 'get') {
    if (!id) return errorResult('id is required for get action');
    const result = await api.getBooking(id, { include: ['person', 'service'] });
    return jsonResult(formatBooking(result.data, { ...formatOptions, included: result.included }));
  }

  if (action === 'create') {
    if (!person_id || !started_on || !ended_on) {
      return errorResult('person_id, started_on, and ended_on are required for create');
    }
    if (!service_id && !event_id) {
      return errorResult('service_id or event_id is required for create');
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
    if (!id) return errorResult('id is required for update action');
    const updateData: Parameters<typeof api.updateBooking>[1] = {};
    if (started_on !== undefined) updateData.started_on = started_on;
    if (ended_on !== undefined) updateData.ended_on = ended_on;
    if (time !== undefined) updateData.time = time;
    if (note !== undefined) updateData.note = note;
    const result = await api.updateBooking(id, updateData);
    return jsonResult({ success: true, ...formatBooking(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getBookings({ filter, page, perPage, include: ['person', 'service'] });
    return jsonResult(
      formatListResponse(result.data, formatBooking, result.meta, {
        ...formatOptions,
        included: result.included,
      })
    );
  }

  return errorResult(`Invalid action "${action}" for bookings. Use: list, get, create, update`);
}
