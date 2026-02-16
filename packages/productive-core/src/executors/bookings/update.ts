import type { ProductiveBooking } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { UpdateBookingOptions } from './types.js';

import { ExecutorValidationError } from '../time/create.js';

export async function updateBooking(
  options: UpdateBookingOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveBooking>> {
  const data: Record<string, string | number | undefined> = {};

  if (options.startedOn !== undefined) data.started_on = options.startedOn;
  if (options.endedOn !== undefined) data.ended_on = options.endedOn;
  if (options.time !== undefined) data.time = options.time;
  if (options.percentage !== undefined) data.percentage = options.percentage;
  if (options.note !== undefined) data.note = options.note;

  if (Object.keys(data).length === 0) {
    throw new ExecutorValidationError(
      'No updates specified. Provide at least one field to update',
      'options',
    );
  }

  const response = await ctx.api.updateBooking(options.id, data);
  return { data: response.data };
}
