/**
 * Companies command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { companiesList, companiesGet, companiesAdd, companiesUpdate } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const companiesCommandConfig: CommandRouterConfig = {
  resource: 'companies',
  handlers: {
    list: companiesList,
    ls: companiesList,
    get: [companiesGet, 'args'],
    add: companiesAdd,
    create: companiesAdd,
    update: [companiesUpdate, 'args'],
  },
};

/**
 * Handle companies command
 */
export const handleCompaniesCommand = createCommandRouter(companiesCommandConfig);
