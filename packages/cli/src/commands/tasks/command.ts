/**
 * Tasks command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { tasksList, tasksGet, tasksAdd, tasksUpdate } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const tasksCommandConfig: CommandRouterConfig = {
  resource: 'tasks',
  handlers: {
    list: tasksList,
    ls: tasksList,
    get: [tasksGet, 'args'],
    add: tasksAdd,
    create: tasksAdd,
    update: [tasksUpdate, 'args'],
  },
};

/**
 * Handle tasks command
 */
export const handleTasksCommand = createCommandRouter(tasksCommandConfig);
