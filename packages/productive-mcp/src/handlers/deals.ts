/**
 * Deals resource handler
 */

import type { HandlerContext, DealArgs, ToolResult } from './types.js';

import { formatDeal, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

export async function handleDeals(
  action: string,
  args: DealArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, name, company_id } = args;

  if (action === 'get') {
    if (!id) return errorResult('id is required for get action');
    const result = await api.getDeal(id, { include: ['company', 'deal_status', 'responsible'] });
    return jsonResult(formatDeal(result.data, { ...formatOptions, included: result.included }));
  }

  if (action === 'create') {
    if (!name || !company_id) {
      return errorResult('name and company_id are required for create');
    }
    const result = await api.createDeal({ name, company_id });
    return jsonResult({ success: true, ...formatDeal(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return errorResult('id is required for update action');
    const updateData: Parameters<typeof api.updateDeal>[1] = {};
    if (name !== undefined) updateData.name = name;
    const result = await api.updateDeal(id, updateData);
    return jsonResult({ success: true, ...formatDeal(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getDeals({
      filter,
      page,
      perPage,
      include: ['company', 'deal_status'],
    });
    return jsonResult(
      formatListResponse(result.data, formatDeal, result.meta, {
        ...formatOptions,
        included: result.included,
      }),
    );
  }

  return errorResult(`Invalid action "${action}" for deals. Use: list, get, create, update`);
}
