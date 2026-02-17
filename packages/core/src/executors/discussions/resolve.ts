import type { ProductiveDiscussion } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ResolveDiscussionOptions } from './types.js';

export async function resolveDiscussion(
  options: ResolveDiscussionOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDiscussion>> {
  const response = await ctx.api.resolveDiscussion(options.id);
  return { data: response.data };
}
