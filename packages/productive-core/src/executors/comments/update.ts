import type { ProductiveComment } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { UpdateCommentOptions } from './types.js';

export async function updateComment(
  options: UpdateCommentOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveComment>> {
  const data: Record<string, string | undefined> = {};
  if (options.body !== undefined) data.body = options.body;

  const response = await ctx.api.updateComment(options.id, data);
  return { data: response.data };
}
