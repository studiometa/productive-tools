/**
 * Companies resource handler
 */

import type { HandlerContext, CompanyArgs, ToolResult } from './types.js';

import { formatCompany, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

export async function handleCompanies(
  action: string,
  args: CompanyArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, name } = args;

  if (action === 'get') {
    if (!id) return errorResult('id is required for get action');
    const result = await api.getCompany(id);
    return jsonResult(formatCompany(result.data, formatOptions));
  }

  if (action === 'create') {
    if (!name) return errorResult('name is required for create');
    const result = await api.createCompany({ name });
    return jsonResult({ success: true, ...formatCompany(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return errorResult('id is required for update action');
    const updateData: Parameters<typeof api.updateCompany>[1] = {};
    if (name !== undefined) updateData.name = name;
    const result = await api.updateCompany(id, updateData);
    return jsonResult({ success: true, ...formatCompany(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getCompanies({ filter, page, perPage });
    return jsonResult(formatListResponse(result.data, formatCompany, result.meta, formatOptions));
  }

  return errorResult(`Invalid action "${action}" for companies. Use: list, get, create, update`);
}
