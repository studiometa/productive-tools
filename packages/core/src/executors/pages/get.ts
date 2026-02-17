import type { ProductivePage } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetPageOptions } from './types.js';

export async function getPage(
  options: GetPageOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductivePage>> {
  const response = await ctx.api.getPage(options.id);
  return { data: response.data, included: response.included };
}
