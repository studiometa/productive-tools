import type { PaginationOptions } from '../types.js';

export interface ListDiscussionsOptions extends PaginationOptions {
  pageId?: string;
  status?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetDiscussionOptions {
  id: string;
  /** Related resources to include (e.g., page) */
  include?: string[];
}

export interface CreateDiscussionOptions {
  body: string;
  pageId: string;
  title?: string;
}

export interface UpdateDiscussionOptions {
  id: string;
  title?: string;
  body?: string;
}

export interface DeleteDiscussionOptions {
  id: string;
}

export interface ResolveDiscussionOptions {
  id: string;
}

export interface ReopenDiscussionOptions {
  id: string;
}
