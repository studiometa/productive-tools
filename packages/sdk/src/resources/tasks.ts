import type { ProductiveTask, ProductiveApiMeta } from '@studiometa/productive-api';

import type { ResolvedResource } from '../json-api.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
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
  data: ResolvedResource[];
  meta: ProductiveApiMeta | undefined;
}

export interface TaskGetResult {
  data: ResolvedResource;
  meta: ProductiveApiMeta | undefined;
}

export class TasksCollection extends BaseCollection {
  /**
   * List tasks with optional filtering, pagination, and includes.
   */
  async list(options: TaskListOptions = {}): Promise<TaskListResult> {
    const response = await this.api.getTasks(options);
    return resolveListResponse<ProductiveTask>(response);
  }

  /**
   * Get a single task by ID, with optional includes.
   */
  async get(id: string, options: TaskGetOptions = {}): Promise<TaskGetResult> {
    const response = await this.api.getTask(id, options);
    return resolveSingleResponse<ProductiveTask>(response);
  }

  /**
   * Create a new task.
   */
  async create(data: TaskCreateData): Promise<TaskGetResult> {
    const response = await this.api.createTask(data);
    return resolveSingleResponse<ProductiveTask>(response);
  }

  /**
   * Update an existing task.
   */
  async update(id: string, data: TaskUpdateData): Promise<TaskGetResult> {
    const response = await this.api.updateTask(id, data);
    return resolveSingleResponse<ProductiveTask>(response);
  }

  /**
   * Iterate over all tasks across all pages.
   */
  all(options: Omit<TaskListOptions, 'page'> = {}): AsyncPaginatedIterator<ResolvedResource> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<ResolvedResource>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
