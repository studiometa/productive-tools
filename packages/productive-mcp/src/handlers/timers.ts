/**
 * Timers MCP handler.
 */

import { listTimers, getTimer, startTimer, stopTimer } from '@studiometa/productive-core';

import type { HandlerContext, TimerArgs, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatTimer } from '../formatters.js';
import { getTimerHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'start', 'stop'];

export async function handleTimers(
  action: string,
  args: TimerArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage, include } = ctx;
  const { id, service_id, time_entry_id } = args;

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await getTimer({ id, include }, execCtx);
    const formatted = formatTimer(result.data, formatOptions);

    if (ctx.includeHints !== false) {
      return jsonResult({ ...formatted, _hints: getTimerHints(id) });
    }
    return jsonResult(formatted);
  }

  if (action === 'start' || action === 'create') {
    if (!service_id && !time_entry_id) {
      return inputErrorResult(ErrorMessages.missingServiceForTimer());
    }
    const result = await startTimer({ serviceId: service_id, timeEntryId: time_entry_id }, execCtx);
    return jsonResult({ success: true, ...formatTimer(result.data, formatOptions) });
  }

  if (action === 'stop') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('stop'));
    const result = await stopTimer({ id }, execCtx);
    return jsonResult({ success: true, ...formatTimer(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await listTimers({ page, perPage, additionalFilters: filter, include }, execCtx);
    return jsonResult(formatListResponse(result.data, formatTimer, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'timers', VALID_ACTIONS));
}
