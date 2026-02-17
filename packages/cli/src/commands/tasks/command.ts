/**
 * Tasks command entry point
 */

import { createCommandRouter } from '../../utils/command-router.js';
import { tasksList, tasksGet, tasksAdd, tasksUpdate } from './handlers.js';

/**
 * Handle tasks command
 */
export const handleTasksCommand = createCommandRouter({
  resource: 'tasks',
  handlers: {
    list: tasksList,
    ls: tasksList,
    get: [tasksGet, 'args'],
    add: tasksAdd,
    create: tasksAdd,
    update: [tasksUpdate, 'args'],
  },
});
