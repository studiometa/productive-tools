import type { ProductiveAttachment } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListAttachmentsOptions } from './types.js';

export function buildAttachmentFilters(options: ListAttachmentsOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.taskId) filter.task_id = options.taskId;
  if (options.commentId) filter.comment_id = options.commentId;
  if (options.pageId) filter.page_id = options.pageId;
  if (options.dealId) filter.deal_id = options.dealId;

  return filter;
}

export async function listAttachments(
  options: ListAttachmentsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveAttachment[]>> {
  const filter = buildAttachmentFilters(options);

  const response = await ctx.api.getAttachments({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter,
  });

  return {
    data: response.data,
    meta: response.meta,
  };
}
