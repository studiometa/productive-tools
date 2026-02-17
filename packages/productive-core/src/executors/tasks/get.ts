import type { ProductiveTask } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetTaskOptions } from './types.js';

export async function getTask(
  options: GetTaskOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTask>> {
  const response = await ctx.api.getTask(options.id, {
    include: options.include ?? ['project', 'assignee', 'workflow_status'],
  });
  return { data: response.data, included: response.included };
}
