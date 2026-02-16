/**
 * Deals resource handler
 */

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

/** Default includes for deals */
const DEFAULT_DEAL_INCLUDE_GET = ['company', 'deal_status', 'responsible'];
const DEFAULT_DEAL_INCLUDE_LIST = ['company', 'deal_status'];
const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'resolve'];

export async function handleDeals(
  action: string,
  args: DealArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, name, company_id, query, type } = args;

  // Handle resolve action
  if (action === 'resolve') {
    return handleResolve({ query, type }, ctx);
  }

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    // Resolve ID if it's a human-friendly identifier (deal number)
    const resolvedId = !isNumericId(id) ? await resolveFilterValue(api, id, 'deal') : id;
    const include = userInclude?.length
      ? [...new Set([...DEFAULT_DEAL_INCLUDE_GET, ...userInclude])]
      : DEFAULT_DEAL_INCLUDE_GET;
    const result = await api.getDeal(resolvedId, { include });
    const formatted = formatDeal(result.data, { ...formatOptions, included: result.included });

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      return jsonResult({
        ...formatted,
        _hints: getDealHints(id),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!name || !company_id) {
      return inputErrorResult(ErrorMessages.missingRequiredFields('deal', ['name', 'company_id']));
    }
    // Resolve company_id if it's a human-friendly identifier
    const resolvedCompanyId = !isNumericId(company_id)
      ? await resolveFilterValue(api, company_id, 'company')
      : company_id;
    const result = await api.createDeal({ name, company_id: resolvedCompanyId });
    return jsonResult({ success: true, ...formatDeal(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const updateData: Parameters<typeof api.updateDeal>[1] = {};
    if (name !== undefined) updateData.name = name;
    const result = await api.updateDeal(id, updateData);
    return jsonResult({ success: true, ...formatDeal(result.data, formatOptions) });
  }

  if (action === 'list') {
    // Resolve any human-friendly identifiers in filters
    const { resolved: resolvedFilter, metadata } = filter
      ? await resolveFilters(api, filter)
      : { resolved: filter, metadata: {} };

    const include = userInclude?.length
      ? [...new Set([...DEFAULT_DEAL_INCLUDE_LIST, ...userInclude])]
      : DEFAULT_DEAL_INCLUDE_LIST;
    const result = await api.getDeals({
      filter: resolvedFilter,
      page,
      perPage,
      include,
    });
    const response = formatListResponse(result.data, formatDeal, result.meta, {
      ...formatOptions,
      included: result.included,
    });

    // Include resolution metadata if any resolutions occurred
    if (Object.keys(metadata).length > 0) {
      return jsonResult({ ...response, _resolved: metadata });
    }

    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'deals', VALID_ACTIONS));
}
