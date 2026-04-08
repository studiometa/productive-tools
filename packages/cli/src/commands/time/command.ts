/**
 * Time command entry point
 *
 * Handles command routing and dispatches to appropriate handlers.
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { timeList, timeGet, timeAdd, timeUpdate, timeDelete } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const timeCommandConfig: CommandRouterConfig = {
  resource: 'time',
  handlers: {
    list: timeList,
    ls: timeList,
    get: [timeGet, 'args'],
    add: timeAdd,
    update: [timeUpdate, 'args'],
    delete: [timeDelete, 'args'],
    rm: [timeDelete, 'args'],
  },
};

/**
 * Handle time command
 */
export const handleTimeCommand = createCommandRouter(timeCommandConfig);
