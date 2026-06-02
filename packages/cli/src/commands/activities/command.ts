/**
 * Activities command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { activitiesList } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const activitiesCommandConfig: CommandRouterConfig = {
  resource: 'activities',
  handlers: {
    list: activitiesList,
    ls: activitiesList,
  },
};

/**
 * Handle activities command
 */
export const handleActivitiesCommand = createCommandRouter(activitiesCommandConfig);
