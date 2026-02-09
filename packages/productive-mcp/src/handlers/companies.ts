/**
 * Companies resource handler
 */

import type { CompanyArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatCompany, formatListResponse } from '../formatters.js';
import { getCompanyHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'create', 'update'];

export async function handleCompanies(
  action: string,
  args: CompanyArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, name } = args;

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await api.getCompany(id);
    const formatted = formatCompany(result.data, formatOptions);

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      return jsonResult({
        ...formatted,
        _hints: getCompanyHints(id),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!name) return inputErrorResult(ErrorMessages.missingRequiredFields('company', ['name']));
    const result = await api.createCompany({ name });
    return jsonResult({ success: true, ...formatCompany(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const updateData: Parameters<typeof api.updateCompany>[1] = {};
    if (name !== undefined) updateData.name = name;
    const result = await api.updateCompany(id, updateData);
    return jsonResult({ success: true, ...formatCompany(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getCompanies({ filter, page, perPage });
    return jsonResult(formatListResponse(result.data, formatCompany, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'companies', VALID_ACTIONS));
}
