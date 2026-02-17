import type { ProductiveDiscussion } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListDiscussionsOptions } from './types.js';

const STATUS_MAP: Record<string, string> = {
  active: '1',
  resolved: '2',
};

export function buildDiscussionFilters(options: ListDiscussionsOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);

  if (options.pageId) filter.page_id = options.pageId;

  if (options.status) {
    const mapped = STATUS_MAP[options.status.toLowerCase()];
    if (mapped) filter.status = mapped;
  }

  return filter;
}

export async function listDiscussions(
  options: ListDiscussionsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDiscussion[]>> {
  const filter = buildDiscussionFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(filter);

  const response = await ctx.api.getDiscussions({
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
