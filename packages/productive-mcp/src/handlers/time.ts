/**
 * Time entries resource handler
 */

import type { HandlerContext, CommonArgs, ToolResult } from './types.js';

import { formatTimeEntry, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

export async function handleTime(
  action: string,
  args: CommonArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, person_id, service_id, task_id, time, date, note } = args;

  if (action === 'get') {
    if (!id) return errorResult('id is required for get action');
    const result = await api.getTimeEntry(id);
    return jsonResult(formatTimeEntry(result.data, formatOptions));
  }

  if (action === 'create') {
    if (!person_id || !service_id || !time || !date) {
      return errorResult('person_id, service_id, time, and date are required for create');
    }
    const result = await api.createTimeEntry({
      person_id,
      service_id,
      time,
      date,
      note,
      task_id,
    });
    return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return errorResult('id is required for update action');
    const updateData: Parameters<typeof api.updateTimeEntry>[1] = {};
    if (time !== undefined) updateData.time = time;
    if (date !== undefined) updateData.date = date;
    if (note !== undefined) updateData.note = note;
    const result = await api.updateTimeEntry(id, updateData);
    return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getTimeEntries({ filter, page, perPage });
    return jsonResult(formatListResponse(result.data, formatTimeEntry, result.meta, formatOptions));
  }

  return errorResult(`Invalid action "${action}" for time. Use: list, get, create, update`);
}
