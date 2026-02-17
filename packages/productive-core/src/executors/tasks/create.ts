import type { ProductiveTask } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CreateTaskOptions } from './types.js';

export async function createTask(
  options: CreateTaskOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTask>> {
  const projectId = await ctx.resolver.resolveValue(options.projectId, 'project');
  const assigneeId = options.assigneeId
    ? await ctx.resolver.resolveValue(options.assigneeId, 'person')
    : undefined;

  const response = await ctx.api.createTask({
    title: options.title,
    project_id: projectId,
    task_list_id: options.taskListId,
    assignee_id: assigneeId,
    description: options.description,
    due_date: options.dueDate,
    start_date: options.startDate,
    initial_estimate: options.initialEstimate,
    workflow_status_id: options.workflowStatusId,
    private: options.isPrivate,
  });

  return { data: response.data };
}
