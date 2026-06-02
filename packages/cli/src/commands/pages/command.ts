/**
 * Pages command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { pagesList, pagesGet, pagesAdd, pagesUpdate, pagesDelete } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const pagesCommandConfig: CommandRouterConfig = {
  resource: 'pages',
  handlers: {
    list: pagesList,
    ls: pagesList,
    get: [pagesGet, 'args'],
    add: pagesAdd,
    create: pagesAdd,
    update: [pagesUpdate, 'args'],
    delete: [pagesDelete, 'args'],
    rm: [pagesDelete, 'args'],
  },
};

/**
 * Handle pages command
 */
export const handlePagesCommand = createCommandRouter(pagesCommandConfig);
