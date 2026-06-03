import type { ProductiveDiscussion, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Discussion } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator, DEFAULT_PAGE_SIZE } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface DiscussionListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
  include?: string[];
}

export interface DiscussionGetOptions {
  include?: string[];
}

export interface DiscussionCreateData {
  body: string;
  page_id: string;
  title?: string;
}

export interface DiscussionUpdateData {
  title?: string;
  body?: string;
}

export interface DiscussionListResult {
  data: Discussion[];
  meta: ProductiveApiMeta | undefined;
}

export interface DiscussionGetResult {
  data: Discussion;
  meta: ProductiveApiMeta | undefined;
}

export class DiscussionsCollection extends BaseCollection {
  /**
   * List discussions with optional filtering, pagination, and includes.
   */
  async list(options: DiscussionListOptions = {}): Promise<DiscussionListResult> {
    const response = await this.wrapRequest(() => this.api.getDiscussions(options));
    return resolveListResponse<ProductiveDiscussion, Discussion>(response);
  }

  /**
   * Get a single discussion by ID, with optional includes.
   */
  async get(id: string, options: DiscussionGetOptions = {}): Promise<DiscussionGetResult> {
    const response = await this.wrapRequest(() => this.api.getDiscussion(id, options));
    return resolveSingleResponse<ProductiveDiscussion, Discussion>(response);
  }

  /**
   * Create a new discussion.
   */
  async create(data: DiscussionCreateData): Promise<DiscussionGetResult> {
    const response = await this.wrapRequest(() => this.api.createDiscussion(data));
    return resolveSingleResponse<ProductiveDiscussion, Discussion>(response);
  }

  /**
   * Update an existing discussion.
   */
  async update(id: string, data: DiscussionUpdateData): Promise<DiscussionGetResult> {
    const response = await this.wrapRequest(() => this.api.updateDiscussion(id, data));
    return resolveSingleResponse<ProductiveDiscussion, Discussion>(response);
  }

  /**
   * Delete a discussion by ID.
   */
  async delete(id: string): Promise<void> {
    await this.wrapRequest(() => this.api.deleteDiscussion(id));
  }

  /**
   * Mark a discussion as resolved.
   */
  async resolve(id: string): Promise<DiscussionGetResult> {
    const response = await this.wrapRequest(() => this.api.resolveDiscussion(id));
    return resolveSingleResponse<ProductiveDiscussion, Discussion>(response);
  }

  /**
   * Reopen a previously resolved discussion.
   */
  async reopen(id: string): Promise<DiscussionGetResult> {
    const response = await this.wrapRequest(() => this.api.reopenDiscussion(id));
    return resolveSingleResponse<ProductiveDiscussion, Discussion>(response);
  }

  /**
   * Start a fluent query builder for discussions, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Discussion, DiscussionListResult> {
    return new QueryBuilder<Discussion, DiscussionListResult>(this).filter(filters);
  }

  /**
   * Iterate over all discussions across all pages.
   */
  all(options: Omit<DiscussionListOptions, 'page'> = {}): AsyncPaginatedIterator<Discussion> {
    const perPage = options.perPage ?? DEFAULT_PAGE_SIZE;
    return new AsyncPaginatedIterator<Discussion>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
