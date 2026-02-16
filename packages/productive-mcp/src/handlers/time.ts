/**
 * Time entries resource handler
 */

import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatTimeEntry } from '../formatters.js';
import { getTimeEntryHints } from '../hints.js';
import {
  resolveFilters,
  resolveFilterValue,
  handleResolve,
  isNumericId,
  type ResolvableResourceType,
} from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'resolve'];

export async function handleTime(
  action: string,
  args: CommonArgs & { query?: string; type?: ResolvableResourceType; project_id?: string },
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, person_id, service_id, task_id, time, date, note, query, type, project_id } = args;

  // Handle resolve action
  if (action === 'resolve') {
    return handleResolve({ query, type, project_id }, ctx);
  }

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await api.getTimeEntry(id);
    const formatted = formatTimeEntry(result.data, formatOptions);

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      const serviceId = result.data.relationships?.service?.data?.id;
      return jsonResult({
        ...formatted,
        _hints: getTimeEntryHints(id, undefined, serviceId),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!person_id || !service_id || !time || !date) {
      return inputErrorResult(
        ErrorMessages.missingRequiredFields('time entry', [
          'person_id',
          'service_id',
          'time',
          'date',
        ]),
      );
    }

    // Resolve person_id and service_id if they are human-friendly identifiers
    const resolvedPersonId = isNumericId(person_id)
      ? person_id
      : await resolveFilterValue(api, person_id, 'person');
    const resolvedServiceId = isNumericId(service_id)
      ? service_id
      : await resolveFilterValue(api, service_id, 'service', project_id);

    const result = await api.createTimeEntry({
      person_id: resolvedPersonId,
      service_id: resolvedServiceId,
      time,
      date,
      note,
      task_id,
    });
    return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const updateData: Parameters<typeof api.updateTimeEntry>[1] = {};
    if (time !== undefined) updateData.time = time;
    if (date !== undefined) updateData.date = date;
    if (note !== undefined) updateData.note = note;
    const result = await api.updateTimeEntry(id, updateData);
    return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
  }

  if (action === 'list') {
    // Resolve any human-friendly identifiers in filters
    const { resolved: resolvedFilter, metadata } = filter
      ? await resolveFilters(api, filter)
      : { resolved: filter, metadata: {} };

    const result = await api.getTimeEntries({ filter: resolvedFilter, page, perPage });
    const response = formatListResponse(result.data, formatTimeEntry, result.meta, formatOptions);

    // Include resolution metadata if any resolutions occurred
    if (Object.keys(metadata).length > 0) {
      return jsonResult({ ...response, _resolved: metadata });
    }

    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'time', VALID_ACTIONS));
}
