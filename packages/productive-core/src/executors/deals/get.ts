import type { ProductiveDeal } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetDealOptions } from './types.js';

export async function getDeal(
  options: GetDealOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDeal>> {
  const resolvedId = await ctx.resolver.resolveValue(options.id, 'deal');
  const response = await ctx.api.getDeal(resolvedId, {
    include: ['company', 'deal_status', 'responsible', 'project'],
  });
  return { data: response.data };
}
