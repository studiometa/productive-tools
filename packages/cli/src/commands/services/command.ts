/**
 * Services command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { servicesGet, servicesList } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const servicesCommandConfig: CommandRouterConfig = {
  resource: 'services',
  handlers: {
    list: servicesList,
    ls: servicesList,
    get: [servicesGet, 'args'],
  },
};

/**
 * Handle services command
 */
export const handleServicesCommand = createCommandRouter(servicesCommandConfig);
