/**
 * Deals MCP handler.
 */

import {
  listDeals,
  getDeal,
  getDealContext,
  createDeal,
  updateDeal,
} from '@studiometa/productive-core';

import type { DealArgs } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatDeal, formatService, formatComment, formatTimeEntry } from '../formatters.js';
import { getDealHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { inputErrorResult, jsonResult } from './utils.js';

export const handleDeals = createResourceHandler<DealArgs>({
  resource: 'deals',
  displayName: 'deal',
  actions: ['list', 'get', 'create', 'update', 'resolve', 'context'],
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
  customActions: {
    context: async (args, ctx, execCtx) => {
      if (!args.id) return inputErrorResult(ErrorMessages.missingId('context'));
      const result = await getDealContext({ id: args.id }, execCtx);
      const formatOptions = { ...ctx.formatOptions, included: result.included };

      return jsonResult({
        ...formatDeal(result.data.deal, formatOptions),
        services: result.data.services.map((s) => formatService(s, { compact: true })),
        comments: result.data.comments.map((c) => formatComment(c, { compact: true })),
        time_entries: result.data.time_entries.map((t) => formatTimeEntry(t, { compact: true })),
      });
    },
  },
  executors: {
    list: listDeals,
    get: getDeal,
    create: createDeal,
    update: updateDeal,
  },
});
