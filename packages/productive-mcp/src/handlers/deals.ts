/**
 * Deals resource handler
 */

import type { DealArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatDeal, formatListResponse } from '../formatters.js';
import { getDealHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

/** Default includes for deals */
const DEFAULT_DEAL_INCLUDE_GET = ['company', 'deal_status', 'responsible'];
const DEFAULT_DEAL_INCLUDE_LIST = ['company', 'deal_status'];
const VALID_ACTIONS = ['list', 'get', 'create', 'update'];

export async function handleDeals(
  action: string,
  args: DealArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, name, company_id } = args;

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const include = userInclude?.length
      ? [...new Set([...DEFAULT_DEAL_INCLUDE_GET, ...userInclude])]
      : DEFAULT_DEAL_INCLUDE_GET;
    const result = await api.getDeal(id, { include });
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
    const result = await api.createDeal({ name, company_id });
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
    const include = userInclude?.length
      ? [...new Set([...DEFAULT_DEAL_INCLUDE_LIST, ...userInclude])]
      : DEFAULT_DEAL_INCLUDE_LIST;
    const result = await api.getDeals({
      filter,
      page,
      perPage,
      include,
    });
    return jsonResult(
      formatListResponse(result.data, formatDeal, result.meta, {
        ...formatOptions,
        included: result.included,
      }),
    );
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'deals', VALID_ACTIONS));
}
