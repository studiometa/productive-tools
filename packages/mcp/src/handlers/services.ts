/**
 * Services MCP handler.
 *
 * Uses the createResourceHandler factory for the common list pattern.
 */

import { getService, listServices } from '@studiometa/productive-core';

import type { CommonArgs } from './types.js';

import { formatService, formatListResponse } from '../formatters.js';
import { getServiceListHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { jsonResult } from './utils.js';

/**
 * Handle services resource.
 *
 * Supports: list
 */
export const handleServices = createResourceHandler<CommonArgs>({
  resource: 'services',
  actions: ['list', 'get'],
  formatter: formatService,
  executors: {
    list: listServices,
    get: getService,
  },
  customActions: {
    list: async (args, ctx, execCtx) => {
      const { formatOptions, filter, page, perPage } = ctx;
      const additionalFilters = { ...filter };

      const result = await listServices({ page, perPage, additionalFilters }, execCtx);

      const response = formatListResponse(result.data, formatService, result.meta, {
        ...formatOptions,
        included: result.included,
      });

      // Append hint when not filtering by deal_id
      // Note: ctx.includeHints is only true for get actions, but list-level
      // hints are lightweight suggestions that should always be included
      const hints = getServiceListHints(additionalFilters);
      if (hints) {
        return jsonResult({ ...response, _hints: hints });
      }

      return jsonResult(response);
    },
  },
});
