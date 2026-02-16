/**
 * Get a single company executor.
 */

import type { ProductiveCompany } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetCompanyOptions } from './types.js';

export async function getCompany(
  options: GetCompanyOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveCompany>> {
  const resolvedId = await ctx.resolver.resolveValue(options.id, 'company');
  const response = await ctx.api.getCompany(resolvedId);
  return { data: response.data };
}
