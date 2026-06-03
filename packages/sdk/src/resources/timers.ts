import type { ProductiveTimer, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Timer } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator, DEFAULT_PAGE_SIZE } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface TimerListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
  include?: string[];
}

export interface TimerGetOptions {
  include?: string[];
}

export interface TimerStartData {
  service_id?: string;
  time_entry_id?: string;
}

export interface TimerListResult {
  data: Timer[];
  meta: ProductiveApiMeta | undefined;
}

export interface TimerGetResult {
  data: Timer;
  meta: ProductiveApiMeta | undefined;
}

export class TimersCollection extends BaseCollection {
  /**
   * List timers with optional filtering, pagination, and includes.
   */
  async list(options: TimerListOptions = {}): Promise<TimerListResult> {
    const response = await this.wrapRequest(() => this.api.getTimers(options));
    return resolveListResponse<ProductiveTimer, Timer>(response);
  }

  /**
   * Get a single timer by ID, with optional includes.
   */
  async get(id: string, options: TimerGetOptions = {}): Promise<TimerGetResult> {
    const response = await this.wrapRequest(() => this.api.getTimer(id, options));
    return resolveSingleResponse<ProductiveTimer, Timer>(response);
  }

  /**
   * Start a new timer, optionally bound to a service or time entry.
   */
  async start(data: TimerStartData = {}): Promise<TimerGetResult> {
    const response = await this.wrapRequest(() => this.api.startTimer(data));
    return resolveSingleResponse<ProductiveTimer, Timer>(response);
  }

  /**
   * Stop a running timer by ID.
   */
  async stop(id: string): Promise<TimerGetResult> {
    const response = await this.wrapRequest(() => this.api.stopTimer(id));
    return resolveSingleResponse<ProductiveTimer, Timer>(response);
  }

  /**
   * Start a fluent query builder for timers, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Timer, TimerListResult> {
    return new QueryBuilder<Timer, TimerListResult>(this).filter(filters);
  }

  /**
   * Iterate over all timers across all pages.
   */
  all(options: Omit<TimerListOptions, 'page'> = {}): AsyncPaginatedIterator<Timer> {
    const perPage = options.perPage ?? DEFAULT_PAGE_SIZE;
    return new AsyncPaginatedIterator<Timer>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
