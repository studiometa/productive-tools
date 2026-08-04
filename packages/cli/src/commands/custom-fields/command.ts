/**
 * Custom fields command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { customFieldsGet, customFieldsList } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const customFieldsCommandConfig: CommandRouterConfig = {
  resource: 'custom-fields',
  handlers: {
    list: customFieldsList,
    ls: customFieldsList,
    get: [customFieldsGet, 'args'],
  },
};

/**
 * Handle custom-fields command
 */
export const handleCustomFieldsCommand = createCommandRouter(customFieldsCommandConfig);
