/**
 * Pages MCP handler.
 *
 * Uses the createResourceHandler factory for the common list/get/create/update/delete pattern.
 */

import {
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
} from '@studiometa/productive-core';

import type { PageArgs } from './types.js';

import { formatPage } from '../formatters.js';
import { getPageHints } from '../hints.js';
import { createResourceHandler, type ResourceHandlerConfig } from './factory.js';

// Type alias for cleaner casts
type Executors = ResourceHandlerConfig<PageArgs>['executors'];

/**
 * Handle pages resource.
 *
 * Supports: list, get, create, update, delete
 */
export const handlePages = createResourceHandler<PageArgs>({
  resource: 'pages',
  actions: ['list', 'get', 'create', 'update', 'delete'],
  formatter: formatPage,
  hints: (_data, id) => getPageHints(id),
  supportsResolve: false,
  create: {
    required: ['title', 'project_id'] as (keyof PageArgs)[],
    mapOptions: (args) => ({
      title: args.title,
      projectId: args.project_id,
      body: args.body,
      parentPageId: args.parent_page_id,
    }),
  },
  update: {
    mapOptions: (args) => ({ title: args.title, body: args.body }),
  },
  executors: {
    list: listPages,
    get: getPage,
    create: createPage as unknown as Executors['create'],
    update: updatePage as unknown as Executors['update'],
    delete: deletePage as unknown as Executors['delete'],
  },
});
