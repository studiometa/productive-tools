/**
 * People command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { peopleList, peopleGet } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const peopleCommandConfig: CommandRouterConfig = {
  resource: 'people',
  handlers: {
    list: peopleList,
    ls: peopleList,
    get: [peopleGet, 'args'],
  },
};

/**
 * Handle people command
 */
export const handlePeopleCommand = createCommandRouter(peopleCommandConfig);
