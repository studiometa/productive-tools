/**
 * Delete an attachment executor.
 */

import type { ExecutorContext } from '../../context/types.js';
import type { DeleteAttachmentOptions } from './types.js';

/**
 * Result of a delete operation.
 */
export interface DeleteAttachmentResult {
  deleted: true;
  id: string;
}

/**
 * Delete an attachment by ID.
 */
export async function deleteAttachment(
  options: DeleteAttachmentOptions,
  ctx: ExecutorContext,
): Promise<{ data: DeleteAttachmentResult }> {
  await ctx.api.deleteAttachment(options.id);

  return {
    data: { deleted: true, id: options.id },
  };
}
