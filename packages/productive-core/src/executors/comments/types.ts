import type { PaginationOptions } from '../types.js';

export interface ListCommentsOptions extends PaginationOptions {
  taskId?: string;
  dealId?: string;
  companyId?: string;
  personId?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetCommentOptions {
  id: string;
  include?: string[];
}

export interface CreateCommentOptions {
  body: string;
  taskId?: string;
  dealId?: string;
  companyId?: string;
  invoiceId?: string;
  personId?: string;
  discussionId?: string;
}

export interface UpdateCommentOptions {
  id: string;
  body?: string;
}
