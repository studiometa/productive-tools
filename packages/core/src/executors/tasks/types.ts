import type { PaginationOptions } from '../types.js';

export interface ListTasksOptions extends PaginationOptions {
  assigneeId?: string;
  creatorId?: string;
  projectId?: string;
  companyId?: string;
  boardId?: string;
  taskListId?: string;
  parentTaskId?: string;
  workflowStatusId?: string;
  /** Status: 'open' | 'completed' | 'done' (default: 'open') */
  status?: string;
  overdue?: boolean;
  dueDate?: string;
  dueBefore?: string;
  dueAfter?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetTaskOptions {
  id: string;
  include?: string[];
}

export interface CreateTaskOptions {
  title: string;
  projectId: string;
  taskListId: string;
  assigneeId?: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  initialEstimate?: number;
  workflowStatusId?: string;
  isPrivate?: boolean;
}

export interface UpdateTaskOptions {
  id: string;
  title?: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  initialEstimate?: number;
  isPrivate?: boolean;
  assigneeId?: string;
  workflowStatusId?: string;
  /** Close or reopen the task */
  closed?: boolean;
}

export interface GetTaskContextOptions {
  id: string;
}

export interface TaskContextResult {
  task: import('@studiometa/productive-api').ProductiveTask;
  comments: import('@studiometa/productive-api').ProductiveComment[];
  time_entries: import('@studiometa/productive-api').ProductiveTimeEntry[];
  subtasks: import('@studiometa/productive-api').ProductiveTask[];
}
