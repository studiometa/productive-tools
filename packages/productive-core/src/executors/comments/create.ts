import type { ProductiveComment } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CreateCommentOptions } from './types.js';

export async function createComment(
  options: CreateCommentOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveComment>> {
  const response = await ctx.api.createComment({
    body: options.body,
    task_id: options.taskId,
    deal_id: options.dealId,
    company_id: options.companyId,
    invoice_id: options.invoiceId,
    person_id: options.personId,
    discussion_id: options.discussionId,
  });

  return { data: response.data };
}
