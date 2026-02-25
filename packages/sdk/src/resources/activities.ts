import type { ProductiveActivity, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Activity } from '../types.js';

import { resolveListResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface ActivityListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  include?: string[];
}

export interface ActivityListResult {
  data: Activity[];
  meta: ProductiveApiMeta | undefined;
}

export class ActivitiesCollection extends BaseCollection {
  /**
   * List activities with optional filtering, pagination, and includes.
   */
  async list(options: ActivityListOptions = {}): Promise<ActivityListResult> {
    const response = await this.wrapRequest(() => this.api.getActivities(options));
    return resolveListResponse<ProductiveActivity, Activity>(response);
  }

  /**
   * Start a fluent query builder for activities, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Activity, ActivityListResult> {
    return new QueryBuilder<Activity, ActivityListResult>(this).filter(filters);
  }

  /**
   * Iterate over all activities across all pages.
   */
  all(options: Omit<ActivityListOptions, 'page'> = {}): AsyncPaginatedIterator<Activity> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Activity>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
