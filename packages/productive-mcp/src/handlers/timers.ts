/**
 * Timers resource handler
 */

import type { HandlerContext, TimerArgs, ToolResult } from './types.js';

import { formatTimer, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

export async function handleTimers(
  action: string,
  args: TimerArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include } = ctx;
  const { id, service_id, time_entry_id } = args;

  if (action === 'get') {
    if (!id) return errorResult('id is required for get action');
    const result = await api.getTimer(id, { include });
    return jsonResult(formatTimer(result.data, formatOptions));
  }

  if (action === 'start' || action === 'create') {
    if (!service_id && !time_entry_id) {
      return errorResult('service_id or time_entry_id is required to start a timer');
    }
    const result = await api.startTimer({ service_id, time_entry_id });
    return jsonResult({ success: true, ...formatTimer(result.data, formatOptions) });
  }

  if (action === 'stop') {
    if (!id) return errorResult('id is required to stop a timer');
    const result = await api.stopTimer(id);
    return jsonResult({ success: true, ...formatTimer(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getTimers({ filter, page, perPage, include });
    return jsonResult(formatListResponse(result.data, formatTimer, result.meta, formatOptions));
  }

  return errorResult(`Invalid action "${action}" for timers. Use: list, get, start, stop`);
}
