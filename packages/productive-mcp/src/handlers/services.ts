/**
 * Services MCP handler.
 */

import { fromHandlerContext, listServices } from '@studiometa/productive-core';

import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatService } from '../formatters.js';
import { resolveFilters, resolveFilterValue, isNumericId } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const resolveFns = { resolveFilterValue, resolveFilters, isNumericId };

const VALID_ACTIONS = ['list'];

export async function handleServices(
  action: string,
  _args: CommonArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage } = ctx;

  if (action === 'list') {
    const execCtx = fromHandlerContext(ctx, resolveFns);
    const result = await listServices({ page, perPage, additionalFilters: filter }, execCtx);

    return jsonResult(formatListResponse(result.data, formatService, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'services', VALID_ACTIONS));
}
