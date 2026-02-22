import type { ProductiveTask } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { UpdateTaskOptions } from './types.js';

import { ExecutorValidationError } from '../errors.js';

export async function updateTask(
  options: UpdateTaskOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTask>> {
  const data: Record<string, string | number | boolean | undefined> = {};

  if (options.title !== undefined) data.title = options.title;
  if (options.description !== undefined) data.description = options.description;
  if (options.dueDate !== undefined) data.due_date = options.dueDate;
  if (options.startDate !== undefined) data.start_date = options.startDate;
  if (options.initialEstimate !== undefined) data.initial_estimate = options.initialEstimate;
  if (options.isPrivate !== undefined) data.private = options.isPrivate;
  if (options.assigneeId !== undefined) {
    data.assignee_id = await ctx.resolver.resolveValue(options.assigneeId, 'person');
  }
  if (options.workflowStatusId !== undefined) data.workflow_status_id = options.workflowStatusId;
  if (options.closed !== undefined) data.closed = options.closed;

  if (Object.keys(data).length === 0) {
    throw new ExecutorValidationError(
      'No updates specified. Provide at least one field to update',
      'options',
    );
  }

  const response = await ctx.api.updateTask(options.id, data);
  return { data: response.data };
}
