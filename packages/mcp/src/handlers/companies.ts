/**
 * Companies MCP handler.
 *
 * Uses the createResourceHandler factory for the common list/get/create/update/resolve pattern.
 */

import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
} from '@studiometa/productive-core';

import type { CompanyArgs } from './types.js';

import { formatCompany } from '../formatters.js';
import { getCompanyHints } from '../hints.js';
import { createResourceHandler, type ResourceHandlerConfig } from './factory.js';

// Type alias for cleaner casts
type Executors = ResourceHandlerConfig<CompanyArgs>['executors'];

/**
 * Handle companies resource.
 *
 * Supports: list, get, create, update, resolve
 */
export const handleCompanies = createResourceHandler<CompanyArgs>({
  resource: 'companies',
  actions: ['list', 'get', 'create', 'update', 'resolve'],
  formatter: formatCompany,
  hints: (_data, id) => getCompanyHints(id),
  supportsResolve: true,
  create: {
    required: ['name'] as (keyof CompanyArgs)[],
    mapOptions: (args) => ({ name: args.name }),
  },
  update: {
    mapOptions: (args) => ({ name: args.name }),
  },
  executors: {
    list: listCompanies,
    get: getCompany,
    create: createCompany as unknown as Executors['create'],
    update: updateCompany as unknown as Executors['update'],
  },
});
