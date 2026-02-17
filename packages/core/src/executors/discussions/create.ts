import type { ProductiveDiscussion } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CreateDiscussionOptions } from './types.js';

export async function createDiscussion(
  options: CreateDiscussionOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDiscussion>> {
  const response = await ctx.api.createDiscussion({
    body: options.body,
    page_id: options.pageId,
    title: options.title,
  });

  return { data: response.data };
}
