import type { ProductiveDiscussion } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ReopenDiscussionOptions } from './types.js';

export async function reopenDiscussion(
  options: ReopenDiscussionOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDiscussion>> {
  const response = await ctx.api.reopenDiscussion(options.id);
  return { data: response.data };
}
