import type { ProductiveBudget } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListBudgetsOptions } from './types.js';

export function buildBudgetFilters(options: ListBudgetsOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.projectId) filter.project_id = options.projectId;
  if (options.companyId) filter.company_id = options.companyId;

  return filter;
}

export async function listBudgets(
  options: ListBudgetsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveBudget[]>> {
  const filter = buildBudgetFilters(options);

  const response = await ctx.api.getBudgets({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter,
  });

  return {
    data: response.data,
    meta: response.meta,
  };
}
