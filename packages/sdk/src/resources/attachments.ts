import type { ProductiveAttachment, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Attachment } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator, DEFAULT_PAGE_SIZE } from '../pagination.js';
import { QueryBuilder, type BaseListOptions } from '../query-builder.js';
import { BaseCollection } from './base.js';

export type AttachmentListOptions = BaseListOptions;

export interface AttachmentGetOptions {
  include?: string[];
}

export interface AttachmentListResult {
  data: Attachment[];
  meta: ProductiveApiMeta | undefined;
}

export interface AttachmentGetResult {
  data: Attachment;
  meta: ProductiveApiMeta | undefined;
}

export class AttachmentsCollection extends BaseCollection {
  /**
   * List attachments with optional filtering, pagination, and includes.
   */
  async list(options: AttachmentListOptions = {}): Promise<AttachmentListResult> {
    const response = await this.wrapRequest(() => this.api.getAttachments(options));
    return resolveListResponse<ProductiveAttachment, Attachment>(response);
  }

  /**
   * Get a single attachment by ID, with optional includes.
   */
  async get(id: string, options: AttachmentGetOptions = {}): Promise<AttachmentGetResult> {
    const response = await this.wrapRequest(() => this.api.getAttachment(id, options));
    return resolveSingleResponse<ProductiveAttachment, Attachment>(response);
  }

  /**
   * Delete an attachment by ID.
   */
  async delete(id: string): Promise<void> {
    await this.wrapRequest(() => this.api.deleteAttachment(id));
  }

  /**
   * Start a fluent query builder for attachments, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Attachment, AttachmentListResult> {
    return new QueryBuilder<Attachment, AttachmentListResult>(this).filter(filters);
  }

  /**
   * Iterate over all attachments across all pages.
   */
  all(options: Omit<AttachmentListOptions, 'page'> = {}): AsyncPaginatedIterator<Attachment> {
    const perPage = options.perPage ?? DEFAULT_PAGE_SIZE;
    return new AsyncPaginatedIterator<Attachment>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
