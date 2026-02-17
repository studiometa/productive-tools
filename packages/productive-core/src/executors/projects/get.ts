/**
 * Get a single project executor.
 */

import type { ProductiveProject } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetProjectOptions } from './types.js';

/**
 * Get a single project by ID.
 * Resolves human-friendly identifiers (e.g., PRJ-123) to numeric IDs.
 */
export async function getProject(
  options: GetProjectOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveProject>> {
  const resolvedId = await ctx.resolver.resolveValue(options.id, 'project');
  const response = await ctx.api.getProject(resolvedId);

  return {
    data: response.data,
  };
}
