/**
 * Companies MCP handler.
 */

import {
  fromHandlerContext,
  listCompanies,
  getCompany,
  createCompany,
} from '@studiometa/productive-core';

import type { CompanyArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatCompany } from '../formatters.js';
import { getCompanyHints } from '../hints.js';
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

export async function handleCompanies(
  action: string,
  args: CompanyArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage } = ctx;
  const { id, name, query, type } = args;

  if (action === 'resolve') {
    return handleResolve({ query, type }, ctx);
  }

  const execCtx = fromHandlerContext(ctx, resolveFns);

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

    const result = await getCompany({ id }, execCtx);
    const formatted = formatCompany(result.data, formatOptions);

    if (ctx.includeHints !== false) {
      return jsonResult({ ...formatted, _hints: getCompanyHints(id) });
    }
    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!name) return inputErrorResult(ErrorMessages.missingRequiredFields('company', ['name']));

    const result = await createCompany({ name }, execCtx);
    return jsonResult({ success: true, ...formatCompany(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));

    // Use API directly — MCP update passes through fields without validation
    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name;
    const apiResult = await ctx.api.updateCompany(id, updateData);
    return jsonResult({ success: true, ...formatCompany(apiResult.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await listCompanies({ page, perPage, additionalFilters: filter }, execCtx);

    const response = formatListResponse(result.data, formatCompany, result.meta, formatOptions);

    if (result.resolved && Object.keys(result.resolved).length > 0) {
      return jsonResult({ ...response, _resolved: result.resolved });
    }
    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'companies', VALID_ACTIONS));
}
