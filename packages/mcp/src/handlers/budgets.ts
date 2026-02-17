/**
 * Budgets MCP handler.
 *
 * Thin adapter that delegates business logic to core executors
 * and handles MCP-specific concerns (hints, error formatting, JSON results).
 */

import { listBudgets, getBudget } from '@studiometa/productive-core';

import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatBudget, formatListResponse } from '../formatters.js';
import { getBudgetHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get'];

export async function handleBudgets(
  action: string,
  args: CommonArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage } = ctx;
  const { id } = args;

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

    const result = await getBudget({ id }, execCtx);
    const formatted = formatBudget(result.data, formatOptions);

    if (ctx.includeHints !== false) {
      return jsonResult({ ...formatted, _hints: getBudgetHints(id) });
    }

    return jsonResult(formatted);
  }

  if (action === 'list') {
    const result = await listBudgets(
      {
        page,
        perPage,
        additionalFilters: filter,
      },
      execCtx,
    );

    return jsonResult(formatListResponse(result.data, formatBudget, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'budgets', VALID_ACTIONS));
}
