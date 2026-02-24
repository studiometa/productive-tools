import type { ProductiveTimeEntry, ProductiveApiMeta } from '@studiometa/productive-api';

import type { TimeEntry } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface TimeListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
  include?: string[];
}

export interface TimeCreateData {
  person_id: string;
  service_id: string;
  date: string;
  time: number;
  note?: string;
  task_id?: string;
}

export interface TimeUpdateData {
  time?: number;
  note?: string;
  date?: string;
}

export interface TimeListResult {
  data: TimeEntry[];
  meta: ProductiveApiMeta | undefined;
}

export interface TimeGetResult {
  data: TimeEntry;
  meta: ProductiveApiMeta | undefined;
}

export class TimeCollection extends BaseCollection {
  /**
   * List time entries with optional filtering, pagination, and includes.
   */
  async list(options: TimeListOptions = {}): Promise<TimeListResult> {
    const response = await this.wrapRequest(() => this.api.getTimeEntries(options));
    return resolveListResponse<ProductiveTimeEntry, TimeEntry>(response);
  }

  /**
   * Get a single time entry by ID.
   */
  async get(id: string): Promise<TimeGetResult> {
    const response = await this.wrapRequest(() => this.api.getTimeEntry(id));
    return resolveSingleResponse<ProductiveTimeEntry, TimeEntry>(response);
  }

  /**
   * Create a new time entry.
   */
  async create(data: TimeCreateData): Promise<TimeGetResult> {
    const response = await this.wrapRequest(() => this.api.createTimeEntry(data));
    return resolveSingleResponse<ProductiveTimeEntry, TimeEntry>(response);
  }

  /**
   * Update an existing time entry.
   */
  async update(id: string, data: TimeUpdateData): Promise<TimeGetResult> {
    const response = await this.wrapRequest(() => this.api.updateTimeEntry(id, data));
    return resolveSingleResponse<ProductiveTimeEntry, TimeEntry>(response);
  }

  /**
   * Delete a time entry.
   */
  async delete(id: string): Promise<void> {
    await this.wrapRequest(() => this.api.deleteTimeEntry(id));
  }

  /**
   * Start a fluent query builder for time entries, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<TimeEntry, TimeListResult> {
    return new QueryBuilder<TimeEntry, TimeListResult>(this).filter(filters);
  }

  /**
   * Iterate over all time entries across all pages.
   */
  all(options: Omit<TimeListOptions, 'page'> = {}): AsyncPaginatedIterator<TimeEntry> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<TimeEntry>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
