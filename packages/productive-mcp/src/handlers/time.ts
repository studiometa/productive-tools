/**
 * Time entries MCP handler.
 *
 * Thin adapter that delegates business logic to core executors
 * and handles MCP-specific concerns (hints, error formatting, JSON results).
 */

import {
  listTimeEntries,
  getTimeEntry,
  createTimeEntry,
  updateTimeEntry,
} from '@studiometa/productive-core';

import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatTimeEntry } from '../formatters.js';
import { getTimeEntryHints } from '../hints.js';
import { handleResolve, type ResolvableResourceType } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'resolve'];

export async function handleTime(
  action: string,
  args: CommonArgs & { query?: string; type?: ResolvableResourceType; project_id?: string },
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage } = ctx;
  const { id, person_id, service_id, task_id, time, date, note, query, type, project_id } = args;

  // Handle resolve action (MCP-specific, no executor equivalent)
  if (action === 'resolve') {
    return handleResolve({ query, type, project_id }, ctx);
  }

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

    const result = await getTimeEntry({ id }, execCtx);
    const formatted = formatTimeEntry(result.data, formatOptions);

    // Add contextual hints unless disabled (MCP-specific)
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

    const result = await createTimeEntry(
      {
        personId: person_id,
        serviceId: service_id,
        time,
        date,
        note: note ?? undefined,
        taskId: task_id,
        projectId: project_id,
      },
      execCtx,
    );

    return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));

    const result = await updateTimeEntry(
      {
        id,
        time: time ?? undefined,
        date: date ?? undefined,
        note: note ?? undefined,
      },
      execCtx,
    );

    return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await listTimeEntries(
      {
        page,
        perPage,
        additionalFilters: filter,
      },
      execCtx,
    );

    const response = formatListResponse(result.data, formatTimeEntry, result.meta, formatOptions);

    // Include resolution metadata if any resolutions occurred
    if (result.resolved && Object.keys(result.resolved).length > 0) {
      return jsonResult({ ...response, _resolved: result.resolved });
    }

    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'time', VALID_ACTIONS));
}
