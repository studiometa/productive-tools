/**
 * Update a time entry executor.
 */

import type { ProductiveTimeEntry } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { UpdateTimeEntryOptions } from './types.js';

import { ExecutorValidationError } from '../errors.js';

/**
 * Update an existing time entry.
 *
 * At least one field (time, date, note) must be provided.
 */
export async function updateTimeEntry(
  options: UpdateTimeEntryOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTimeEntry>> {
  const data: { time?: number; note?: string; date?: string } = {};
  if (options.time !== undefined) data.time = options.time;
  if (options.date !== undefined) data.date = options.date;
  if (options.note !== undefined) data.note = options.note;

  if (Object.keys(data).length === 0) {
    throw new ExecutorValidationError(
      'No updates specified. Provide at least one of: time, date, note',
      'options',
    );
  }

  const response = await ctx.api.updateTimeEntry(options.id, data);

  return {
    data: response.data,
  };
}
