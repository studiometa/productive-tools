import type { ProductiveComment } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetCommentOptions } from './types.js';

export async function getComment(
  options: GetCommentOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveComment>> {
  const response = await ctx.api.getComment(options.id);
  return { data: response.data };
}
