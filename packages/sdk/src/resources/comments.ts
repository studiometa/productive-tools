import type { ProductiveComment, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Comment } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface CommentListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  include?: string[];
}

export interface CommentGetOptions {
  include?: string[];
}

export interface CommentCreateData {
  body: string;
  hidden?: boolean;
  task_id?: string;
  deal_id?: string;
  company_id?: string;
  invoice_id?: string;
  person_id?: string;
  discussion_id?: string;
}

export interface CommentUpdateData {
  body?: string;
  hidden?: boolean;
}

export interface CommentListResult {
  data: Comment[];
  meta: ProductiveApiMeta | undefined;
}

export interface CommentGetResult {
  data: Comment;
  meta: ProductiveApiMeta | undefined;
}

export class CommentsCollection extends BaseCollection {
  /**
   * List comments with optional filtering, pagination, and includes.
   */
  async list(options: CommentListOptions = {}): Promise<CommentListResult> {
    const response = await this.wrapRequest(() => this.api.getComments(options));
    return resolveListResponse<ProductiveComment, Comment>(response);
  }

  /**
   * Get a single comment by ID, with optional includes.
   */
  async get(id: string, options: CommentGetOptions = {}): Promise<CommentGetResult> {
    const response = await this.wrapRequest(() => this.api.getComment(id, options));
    return resolveSingleResponse<ProductiveComment, Comment>(response);
  }

  /**
   * Create a new comment.
   */
  async create(data: CommentCreateData): Promise<CommentGetResult> {
    const response = await this.wrapRequest(() => this.api.createComment(data));
    return resolveSingleResponse<ProductiveComment, Comment>(response);
  }

  /**
   * Update an existing comment.
   */
  async update(id: string, data: CommentUpdateData): Promise<CommentGetResult> {
    const response = await this.wrapRequest(() => this.api.updateComment(id, data));
    return resolveSingleResponse<ProductiveComment, Comment>(response);
  }

  /**
   * Start a fluent query builder for comments, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Comment, CommentListResult> {
    return new QueryBuilder<Comment, CommentListResult>(this).filter(filters);
  }

  /**
   * Iterate over all comments across all pages.
   */
  all(options: Omit<CommentListOptions, 'page'> = {}): AsyncPaginatedIterator<Comment> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Comment>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
