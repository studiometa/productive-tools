import type { ProductiveTimeEntry, ProductiveApiMeta } from '@studiometa/productive-api';

import type { ResolvedResource } from '../json-api.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
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
  data: ResolvedResource[];
  meta: ProductiveApiMeta | undefined;
}

export interface TimeGetResult {
  data: ResolvedResource;
  meta: ProductiveApiMeta | undefined;
}

export class TimeCollection extends BaseCollection {
  /**
   * List time entries with optional filtering, pagination, and includes.
   */
  async list(options: TimeListOptions = {}): Promise<TimeListResult> {
    const response = await this.api.getTimeEntries(options);
    return resolveListResponse<ProductiveTimeEntry>(response);
  }

  /**
   * Get a single time entry by ID.
   */
  async get(id: string): Promise<TimeGetResult> {
    const response = await this.api.getTimeEntry(id);
    return resolveSingleResponse<ProductiveTimeEntry>(response);
  }

  /**
   * Create a new time entry.
   */
  async create(data: TimeCreateData): Promise<TimeGetResult> {
    const response = await this.api.createTimeEntry(data);
    return resolveSingleResponse<ProductiveTimeEntry>(response);
  }

  /**
   * Update an existing time entry.
   */
  async update(id: string, data: TimeUpdateData): Promise<TimeGetResult> {
    const response = await this.api.updateTimeEntry(id, data);
    return resolveSingleResponse<ProductiveTimeEntry>(response);
  }

  /**
   * Delete a time entry.
   */
  async delete(id: string): Promise<void> {
    await this.api.deleteTimeEntry(id);
  }

  /**
   * Iterate over all time entries across all pages.
   */
  all(options: Omit<TimeListOptions, 'page'> = {}): AsyncPaginatedIterator<ResolvedResource> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<ResolvedResource>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
