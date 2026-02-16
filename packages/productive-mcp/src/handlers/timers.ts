/**
 * Timers MCP handler.
 */

import { fromHandlerContext, listTimers, startTimer, stopTimer } from '@studiometa/productive-core';

import type { HandlerContext, TimerArgs, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatTimer } from '../formatters.js';
import { getTimerHints } from '../hints.js';
import { resolveFilters, resolveFilterValue, isNumericId } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const resolveFns = { resolveFilterValue, resolveFilters, isNumericId };

const VALID_ACTIONS = ['list', 'get', 'start', 'stop'];

export async function handleTimers(
  action: string,
  args: TimerArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include } = ctx;
  const { id, service_id, time_entry_id } = args;

  const execCtx = fromHandlerContext(ctx, resolveFns);

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    // Use API directly to preserve include handling
    const result = await api.getTimer(id, { include });
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
