import type { ExecutorContext } from '../../context/types.js';
import type { DeletePageOptions } from './types.js';

export interface DeleteResult {
  deleted: true;
  id: string;
}

export async function deletePage(
  options: DeletePageOptions,
  ctx: ExecutorContext,
): Promise<{ data: DeleteResult }> {
  await ctx.api.deletePage(options.id);

  return {
    data: { deleted: true, id: options.id },
  };
}
