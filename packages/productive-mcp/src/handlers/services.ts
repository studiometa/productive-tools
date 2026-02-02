/**
 * Services resource handler
 */

import type { HandlerContext, CommonArgs, ToolResult } from './types.js';

import { formatService, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

export async function handleServices(
  action: string,
  _args: CommonArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;

  if (action === 'list') {
    const result = await api.getServices({ filter, page, perPage });
    return jsonResult(formatListResponse(result.data, formatService, result.meta, formatOptions));
  }

  return errorResult(`Invalid action "${action}" for services. Use: list`);
}
