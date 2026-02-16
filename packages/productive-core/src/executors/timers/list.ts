import type { ProductiveTimer } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListTimersOptions } from './types.js';

export function buildTimerFilters(options: ListTimersOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.personId) filter.person_id = options.personId;

  return filter;
}

export async function listTimers(
  options: ListTimersOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTimer[]>> {
  const filter = buildTimerFilters(options);

  const response = await ctx.api.getTimers({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter,
  });

  return {
    data: response.data,
    meta: response.meta,
  };
}
