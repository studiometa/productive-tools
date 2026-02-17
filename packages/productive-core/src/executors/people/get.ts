/**
 * Get a single person executor.
 */

import type { ProductivePerson } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetPersonOptions } from './types.js';

export async function getPerson(
  options: GetPersonOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductivePerson>> {
  const resolvedId = await ctx.resolver.resolveValue(options.id, 'person');
  const response = await ctx.api.getPerson(resolvedId);
  return { data: response.data };
}
