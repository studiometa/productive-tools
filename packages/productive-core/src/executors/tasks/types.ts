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
}
