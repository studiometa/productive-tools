import type { ProductiveTask } from '@studiometa/productive-api';

import type { ExecutorContext, ResolvableResourceType } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListTasksOptions } from './types.js';

const STATUS_MAP: Record<string, string> = {
  open: '1',
  completed: '2',
  done: '2',
};

const FILTER_TYPE_MAPPING: Record<string, ResolvableResourceType> = {
  assignee_id: 'person',
  creator_id: 'person',
  project_id: 'project',
  company_id: 'company',
};

export function buildTaskFilters(options: ListTasksOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);

  if (options.assigneeId) filter.assignee_id = options.assigneeId;
  if (options.creatorId) filter.creator_id = options.creatorId;
  if (options.projectId) filter.project_id = options.projectId;
  if (options.companyId) filter.company_id = options.companyId;
  if (options.boardId) filter.board_id = options.boardId;
  if (options.taskListId) filter.task_list_id = options.taskListId;
  if (options.parentTaskId) filter.parent_task_id = options.parentTaskId;
  if (options.workflowStatusId) filter.workflow_status_id = options.workflowStatusId;

  const status = (options.status || 'open').toLowerCase();
  const mapped = STATUS_MAP[status];
  if (mapped) filter.status = mapped;

  if (options.overdue) filter.overdue_status = '2';
  if (options.dueDate) filter.due_date_on = options.dueDate;
  if (options.dueBefore) filter.due_date_before = options.dueBefore;
  if (options.dueAfter) filter.due_date_after = options.dueAfter;

  return filter;
}

export async function listTasks(
  options: ListTasksOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTask[]>> {
  const filter = buildTaskFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(
    filter,
    FILTER_TYPE_MAPPING,
  );

  const response = await ctx.api.getTasks({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter: resolvedFilter,
    sort: options.sort,
    include: options.include ?? ['project', 'assignee', 'workflow_status'],
  });

  return {
    data: response.data,
    meta: response.meta,
    included: response.included,
    resolved: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
