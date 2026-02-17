import type { ProductivePage } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListPagesOptions } from './types.js';

export function buildPageFilters(options: ListPagesOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);

  if (options.projectId) filter.project_id = options.projectId;
  if (options.creatorId) filter.creator_id = options.creatorId;

  return filter;
}

export async function listPages(
  options: ListPagesOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductivePage[]>> {
  const filter = buildPageFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(filter);

  const response = await ctx.api.getPages({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter: resolvedFilter,
    sort: options.sort,
  });

  return {
    data: response.data,
    meta: response.meta,
    included: response.included,
    resolved: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
