/**
 * List activities executor.
 */

import type { ProductiveActivity } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListActivitiesOptions } from './types.js';

import { buildListParams } from '../types.js';

export async function listActivities(
  options: ListActivitiesOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveActivity[]>> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) {
    Object.assign(filter, options.additionalFilters);
  }

  const response = await ctx.api.getActivities({
    ...buildListParams(options),
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });

  return {
    data: response.data,
    meta: response.meta,
    included: response.included,
  };
}
