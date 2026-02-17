import type { ProductiveTimer } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { StopTimerOptions } from './types.js';

export async function stopTimer(
  options: StopTimerOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTimer>> {
  const response = await ctx.api.stopTimer(options.id);
  return { data: response.data };
}
