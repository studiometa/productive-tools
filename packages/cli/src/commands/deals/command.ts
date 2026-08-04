/**
 * Deals command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { dealsList, dealsGet, dealsAdd, dealsUpdate } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const dealsCommandConfig: CommandRouterConfig = {
  resource: 'deals',
  handlers: {
    list: dealsList,
    ls: dealsList,
    get: [dealsGet, 'args'],
    add: dealsAdd,
    create: dealsAdd,
    update: [dealsUpdate, 'args'],
  },
};

/**
 * Handle deals command
 */
export const handleDealsCommand = createCommandRouter(dealsCommandConfig);
