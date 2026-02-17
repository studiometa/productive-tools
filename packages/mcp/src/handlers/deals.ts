/**
 * Deals MCP handler.
 */

import { listDeals, getDeal, createDeal, updateDeal } from '@studiometa/productive-core';

import type { DealArgs } from './types.js';

import { formatDeal } from '../formatters.js';
import { getDealHints } from '../hints.js';
import { createResourceHandler } from './factory.js';

export const handleDeals = createResourceHandler<DealArgs>({
  resource: 'deals',
  displayName: 'deal',
  actions: ['list', 'get', 'create', 'update', 'resolve'],
  formatter: formatDeal,
  hints: (_data, id) => getDealHints(id),
  supportsResolve: true,
  defaultInclude: {
    list: ['company', 'deal_status'],
    get: ['company', 'deal_status', 'responsible'],
  },
  create: {
    required: ['name', 'company_id'],
    mapOptions: (args) => ({ name: args.name, companyId: args.company_id }),
  },
  update: {
    mapOptions: (args) => ({ name: args.name }),
  },
  executors: {
    list: listDeals,
    get: getDeal,
    create: createDeal,
    update: updateDeal,
  },
});
