/**
 * Delete a time entry executor.
 */

import type { ExecutorContext } from '../../context/types.js';
import type { DeleteTimeEntryOptions } from './types.js';

/**
 * Result of a delete operation.
 */
export interface DeleteResult {
  deleted: true;
  id: string;
}

/**
 * Delete a time entry by ID.
 */
export async function deleteTimeEntry(
  options: DeleteTimeEntryOptions,
  ctx: ExecutorContext,
): Promise<{ data: DeleteResult }> {
  await ctx.api.deleteTimeEntry(options.id);

  return {
    data: { deleted: true, id: options.id },
  };
}
