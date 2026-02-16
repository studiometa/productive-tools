/**
 * Deals MCP handler.
 */

import { fromHandlerContext, listDeals, getDeal, createDeal } from '@studiometa/productive-core';

import type { DealArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatDeal, formatListResponse } from '../formatters.js';
import { getDealHints } from '../hints.js';
import {
  resolveFilters,
  resolveFilterValue,
  handleResolve,
  isNumericId,
  type ResolvableResourceType,
} from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const resolveFns = { resolveFilterValue, resolveFilters, isNumericId };

const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'resolve'];

export async function handleDeals(
  action: string,
  args: DealArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, name, company_id, query, type } = args;

  if (action === 'resolve') {
    return handleResolve({ query, type }, ctx);
  }

  const execCtx = fromHandlerContext(ctx, resolveFns);

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const getInclude = userInclude?.length
      ? [...new Set(['company', 'deal_status', 'responsible', ...userInclude])]
      : ['company', 'deal_status', 'responsible'];
    const result = await getDeal({ id, include: getInclude }, execCtx);
    const formatted = formatDeal(result.data, { ...formatOptions, included: result.included });

    if (ctx.includeHints !== false) {
      return jsonResult({ ...formatted, _hints: getDealHints(id) });
    }
    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!name || !company_id) {
      return inputErrorResult(ErrorMessages.missingRequiredFields('deal', ['name', 'company_id']));
    }
    const result = await createDeal({ name, companyId: company_id }, execCtx);
    return jsonResult({ success: true, ...formatDeal(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    // Use API directly — MCP update passes through simple fields
    const updateData: Parameters<typeof api.updateDeal>[1] = {};
    if (name !== undefined) updateData.name = name;
    const result = await api.updateDeal(id, updateData);
    return jsonResult({ success: true, ...formatDeal(result.data, formatOptions) });
  }

  if (action === 'list') {
    const listInclude = userInclude?.length
      ? [...new Set(['company', 'deal_status', ...userInclude])]
      : ['company', 'deal_status'];
    const result = await listDeals(
      { page, perPage, additionalFilters: filter, include: listInclude },
      execCtx,
    );

    const response = formatListResponse(result.data, formatDeal, result.meta, {
      ...formatOptions,
      included: result.included,
    });

    if (result.resolved && Object.keys(result.resolved).length > 0) {
      return jsonResult({ ...response, _resolved: result.resolved });
    }
    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'deals', VALID_ACTIONS));
}
