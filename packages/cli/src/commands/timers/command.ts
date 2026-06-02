/**
 * Timers command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { timersList, timersGet, timersStart, timersStop } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const timersCommandConfig: CommandRouterConfig = {
  resource: 'timers',
  handlers: {
    list: timersList,
    ls: timersList,
    get: [timersGet, 'args'],
    start: timersStart,
    stop: [timersStop, 'args'],
  },
};

/**
 * Handle timers command
 */
export const handleTimersCommand = createCommandRouter(timersCommandConfig);
