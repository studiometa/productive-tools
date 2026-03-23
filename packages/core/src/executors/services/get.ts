/**
 * Get a single service executor.
 */

import type { ProductiveService } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetServiceOptions } from './types.js';

/**
 * Get a single service by ID.
 */
export async function getService(
  options: GetServiceOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveService>> {
  const response = await ctx.api.getService(options.id, {
    include: options.include,
  });

  return {
    data: response.data,
    included: response.included,
  };
}
