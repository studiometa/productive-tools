import type { ProductiveTimer } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetTimerOptions } from './types.js';

export async function getTimer(
  options: GetTimerOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTimer>> {
  const response = await ctx.api.getTimer(options.id);
  return { data: response.data };
}
