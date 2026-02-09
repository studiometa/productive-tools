/**
 * Timers resource handler
 */

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
  const { api, formatOptions, filter, page, perPage, include } = ctx;
  const { id, service_id, time_entry_id } = args;

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await api.getTimer(id, { include });
    const formatted = formatTimer(result.data, formatOptions);

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      // Timer doesn't have service relationship directly, only time_entry
      return jsonResult({
        ...formatted,
        _hints: getTimerHints(id),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'start' || action === 'create') {
    if (!service_id && !time_entry_id) {
      return inputErrorResult(ErrorMessages.missingServiceForTimer());
    }
    const result = await api.startTimer({ service_id, time_entry_id });
    return jsonResult({ success: true, ...formatTimer(result.data, formatOptions) });
  }

  if (action === 'stop') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('stop'));
    const result = await api.stopTimer(id);
    return jsonResult({ success: true, ...formatTimer(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getTimers({ filter, page, perPage, include });
    return jsonResult(formatListResponse(result.data, formatTimer, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'timers', VALID_ACTIONS));
}
