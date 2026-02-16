import type { ProductiveTimer } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { StartTimerOptions } from './types.js';

export async function startTimer(
  options: StartTimerOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTimer>> {
  const response = await ctx.api.startTimer({
    service_id: options.serviceId,
    time_entry_id: options.timeEntryId,
  });

  return { data: response.data };
}
