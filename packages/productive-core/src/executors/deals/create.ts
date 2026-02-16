import type { ProductiveDeal } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CreateDealOptions } from './types.js';

export async function createDeal(
  options: CreateDealOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDeal>> {
  const companyId = await ctx.resolver.resolveValue(options.companyId, 'company');
  const responsibleId = options.responsibleId
    ? await ctx.resolver.resolveValue(options.responsibleId, 'person')
    : undefined;

  const response = await ctx.api.createDeal({
    name: options.name,
    company_id: companyId,
    date: options.date,
    budget: options.budget,
    responsible_id: responsibleId,
  });

  return { data: response.data };
}
