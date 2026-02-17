import type { ProductiveDiscussion } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetDiscussionOptions } from './types.js';

export async function getDiscussion(
  options: GetDiscussionOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDiscussion>> {
  const response = await ctx.api.getDiscussion(options.id);
  return { data: response.data, included: response.included };
}
