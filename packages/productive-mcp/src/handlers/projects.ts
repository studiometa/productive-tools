/**
 * Projects resource handler
 */

import type { HandlerContext, CommonArgs, ToolResult } from './types.js';

import { formatProject, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

export async function handleProjects(
  action: string,
  args: CommonArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id } = args;

  if (action === 'get') {
    if (!id) return errorResult('id is required for get action');
    const result = await api.getProject(id);
    return jsonResult(formatProject(result.data, formatOptions));
  }

  if (action === 'list') {
    const result = await api.getProjects({ filter, page, perPage });
    return jsonResult(formatListResponse(result.data, formatProject, result.meta, formatOptions));
  }

  return errorResult(`Invalid action "${action}" for projects. Use: list, get`);
}
