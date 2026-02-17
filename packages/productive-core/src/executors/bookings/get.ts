import type { ProductiveBooking } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetBookingOptions } from './types.js';

export async function getBooking(
  options: GetBookingOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveBooking>> {
  const response = await ctx.api.getBooking(options.id, {
    include: options.include,
  });
  return { data: response.data, included: response.included };
}
