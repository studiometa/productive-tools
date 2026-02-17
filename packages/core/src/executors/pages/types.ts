import type { PaginationOptions } from '../types.js';

export interface ListPagesOptions extends PaginationOptions {
  projectId?: string;
  creatorId?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetPageOptions {
  id: string;
}

export interface CreatePageOptions {
  title: string;
  body?: string;
  projectId: string;
  parentPageId?: string;
}

export interface UpdatePageOptions {
  id: string;
  title?: string;
  body?: string;
}

export interface DeletePageOptions {
  id: string;
}
