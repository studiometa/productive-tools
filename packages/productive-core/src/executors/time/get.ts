/**
 * Get a single time entry executor.
 */

import type { ProductiveTimeEntry } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetTimeEntryOptions } from './types.js';

/**
 * Get a single time entry by ID.
 */
export async function getTimeEntry(
  options: GetTimeEntryOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTimeEntry>> {
  const response = await ctx.api.getTimeEntry(options.id);

  return {
    data: response.data,
  };
}
