import type { ProductiveBudget } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetBudgetOptions } from './types.js';

export async function getBudget(
  options: GetBudgetOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveBudget>> {
  const response = await ctx.api.getBudget(options.id);
  return { data: response.data };
}
