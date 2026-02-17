import type { PaginationOptions } from '../types.js';

export interface ListAttachmentsOptions extends PaginationOptions {
  taskId?: string;
  commentId?: string;
  pageId?: string;
  dealId?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetAttachmentOptions {
  id: string;
}

export interface DeleteAttachmentOptions {
  id: string;
}
