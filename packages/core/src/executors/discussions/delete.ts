import type { ExecutorContext } from '../../context/types.js';
import type { DeleteDiscussionOptions } from './types.js';

export interface DeleteResult {
  deleted: true;
  id: string;
}

export async function deleteDiscussion(
  options: DeleteDiscussionOptions,
  ctx: ExecutorContext,
): Promise<{ data: DeleteResult }> {
  await ctx.api.deleteDiscussion(options.id);

  return {
    data: { deleted: true, id: options.id },
  };
}
