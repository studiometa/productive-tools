/**
 * Timers MCP handler.
 */

import { listTimers, getTimer, startTimer, stopTimer } from '@studiometa/productive-core';

import type { TimerArgs } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatTimer } from '../formatters.js';
import { getTimerHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { inputErrorResult, jsonResult } from './utils.js';

export const handleTimers = createResourceHandler<TimerArgs>({
  resource: 'timers',
  actions: ['list', 'get', 'start', 'stop'],
  formatter: formatTimer,
  hints: (_data, id) => getTimerHints(id),
  customActions: {
    start: async (args, ctx, execCtx) => {
      if (!args.service_id && !args.time_entry_id) {
        return inputErrorResult(ErrorMessages.missingServiceForTimer());
      }
      const result = await startTimer(
        { serviceId: args.service_id, timeEntryId: args.time_entry_id },
        execCtx,
      );
      return jsonResult({ success: true, ...formatTimer(result.data, ctx.formatOptions) });
    },
    create: async (args, ctx, execCtx) => {
      // 'create' is an alias for 'start'
      if (!args.service_id && !args.time_entry_id) {
        return inputErrorResult(ErrorMessages.missingServiceForTimer());
      }
      const result = await startTimer(
        { serviceId: args.service_id, timeEntryId: args.time_entry_id },
        execCtx,
      );
      return jsonResult({ success: true, ...formatTimer(result.data, ctx.formatOptions) });
    },
    stop: async (args, ctx, execCtx) => {
      if (!args.id) return inputErrorResult(ErrorMessages.missingId('stop'));
      const result = await stopTimer({ id: args.id }, execCtx);
      return jsonResult({ success: true, ...formatTimer(result.data, ctx.formatOptions) });
    },
  },
  executors: {
    list: listTimers,
    get: getTimer,
  },
});
