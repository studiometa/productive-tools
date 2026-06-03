import type { ProductiveAttachment } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetAttachmentOptions } from './types.js';

export async function getAttachment(
  options: GetAttachmentOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveAttachment>> {
  const response = await ctx.api.getAttachment(options.id, { include: options.include });
  return { data: response.data, included: response.included };
}
