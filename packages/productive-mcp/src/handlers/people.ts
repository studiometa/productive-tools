/**
 * People resource handler
 */

import type { ProductiveCredentials } from '../auth.js';
import type { HandlerContext, CommonArgs, ToolResult } from './types.js';

import { formatPerson, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

export async function handlePeople(
  action: string,
  args: CommonArgs,
  ctx: HandlerContext,
  credentials: ProductiveCredentials,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id } = args;

  if (action === 'get') {
    if (!id) return errorResult('id is required for get action');
    const result = await api.getPerson(id);
    return jsonResult(formatPerson(result.data, formatOptions));
  }

  if (action === 'me') {
    if (credentials.userId) {
      const result = await api.getPerson(credentials.userId);
      return jsonResult(formatPerson(result.data, formatOptions));
    }
    return jsonResult({
      message: 'User ID not configured. Set userId in credentials to use this action.',
      organizationId: credentials.organizationId,
    });
  }

  if (action === 'list') {
    const result = await api.getPeople({ filter, page, perPage });
    return jsonResult(formatListResponse(result.data, formatPerson, result.meta, formatOptions));
  }

  return errorResult(`Invalid action "${action}" for people. Use: list, get, me`);
}
