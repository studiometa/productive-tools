import type { ProductiveTask, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Task } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface TaskListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
  include?: string[];
}

export interface TaskGetOptions {
  include?: string[];
}

export interface TaskCreateData {
  title: string;
  project_id: string;
  task_list_id: string;
  assignee_id?: string;
  description?: string;
  due_date?: string;
  start_date?: string;
  initial_estimate?: number;
  workflow_status_id?: string;
  private?: boolean;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  due_date?: string;
  start_date?: string;
  initial_estimate?: number;
  workflow_status_id?: string;
  assignee_id?: string;
  closed?: boolean;
}

export interface TaskListResult {
  data: Task[];
  meta: ProductiveApiMeta | undefined;
}

export interface TaskGetResult {
  data: Task;
  meta: ProductiveApiMeta | undefined;
}

export class TasksCollection extends BaseCollection {
  /**
   * List tasks with optional filtering, pagination, and includes.
   */
  async list(options: TaskListOptions = {}): Promise<TaskListResult> {
    const response = await this.wrapRequest(() => this.api.getTasks(options));
    return resolveListResponse<ProductiveTask, Task>(response);
  }

  /**
   * Get a single task by ID, with optional includes.
   */
  async get(id: string, options: TaskGetOptions = {}): Promise<TaskGetResult> {
    const response = await this.wrapRequest(() => this.api.getTask(id, options));
    return resolveSingleResponse<ProductiveTask, Task>(response);
  }

  /**
   * Create a new task.
   */
  async create(data: TaskCreateData): Promise<TaskGetResult> {
    const response = await this.wrapRequest(() => this.api.createTask(data));
    return resolveSingleResponse<ProductiveTask, Task>(response);
  }

  /**
   * Update an existing task.
   */
  async update(id: string, data: TaskUpdateData): Promise<TaskGetResult> {
    const response = await this.wrapRequest(() => this.api.updateTask(id, data));
    return resolveSingleResponse<ProductiveTask, Task>(response);
  }

  /**
   * Start a fluent query builder for tasks, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Task, TaskListResult> {
    return new QueryBuilder<Task, TaskListResult>(this).filter(filters);
  }

  /**
   * Iterate over all tasks across all pages.
   */
  all(options: Omit<TaskListOptions, 'page'> = {}): AsyncPaginatedIterator<Task> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Task>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
