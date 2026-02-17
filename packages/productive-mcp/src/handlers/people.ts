/**
 * People MCP handler.
 */

import { listPeople, getPerson } from '@studiometa/productive-core';

import type { ProductiveCredentials } from '../auth.js';
import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatPerson } from '../formatters.js';
import { getPersonHints } from '../hints.js';
import { handleResolve, type ResolvableResourceType } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'me', 'resolve'];

export async function handlePeople(
  action: string,
  args: CommonArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
  credentials: ProductiveCredentials,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage } = ctx;
  const { id, query, type } = args;

  if (action === 'resolve') {
    return handleResolve({ query, type }, ctx);
  }

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

    const result = await getPerson({ id }, execCtx);
    const formatted = formatPerson(result.data, formatOptions);

    if (ctx.includeHints !== false) {
      return jsonResult({ ...formatted, _hints: getPersonHints(id) });
    }
    return jsonResult(formatted);
  }

  if (action === 'me') {
    if (credentials.userId) {
      const result = await getPerson({ id: credentials.userId }, execCtx);
      const formatted = formatPerson(result.data, formatOptions);

      if (ctx.includeHints !== false) {
        return jsonResult({ ...formatted, _hints: getPersonHints(credentials.userId) });
      }
      return jsonResult(formatted);
    }
    return jsonResult({
      message: 'User ID not configured. Set userId in credentials to use this action.',
      hint: 'Use action="list" to find people, or configure the user ID in your credentials.',
      organizationId: credentials.organizationId,
    });
  }

  if (action === 'list') {
    const result = await listPeople({ page, perPage, additionalFilters: filter }, execCtx);

    const response = formatListResponse(result.data, formatPerson, result.meta, formatOptions);

    if (result.resolved && Object.keys(result.resolved).length > 0) {
      return jsonResult({ ...response, _resolved: result.resolved });
    }
    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'people', VALID_ACTIONS));
}
