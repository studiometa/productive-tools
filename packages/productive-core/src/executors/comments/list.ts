import type { ProductiveComment } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListCommentsOptions } from './types.js';

export function buildCommentFilters(options: ListCommentsOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.taskId) filter.task_id = options.taskId;
  if (options.dealId) filter.deal_id = options.dealId;
  if (options.companyId) filter.company_id = options.companyId;
  if (options.personId) filter.person_id = options.personId;

  return filter;
}

export async function listComments(
  options: ListCommentsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveComment[]>> {
  const filter = buildCommentFilters(options);

  const response = await ctx.api.getComments({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter,
    include: options.include,
  });

  return {
    data: response.data,
    meta: response.meta,
  };
}
