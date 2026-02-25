import type { ProductivePage, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Page } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface PageListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
}

export interface PageCreateData {
  title: string;
  project_id: string;
  body?: string;
  parent_page_id?: string;
}

export interface PageUpdateData {
  title?: string;
  body?: string;
}

export interface PageListResult {
  data: Page[];
  meta: ProductiveApiMeta | undefined;
}

export interface PageGetResult {
  data: Page;
  meta: ProductiveApiMeta | undefined;
}

export class PagesCollection extends BaseCollection {
  /**
   * List pages with optional filtering and pagination.
   */
  async list(options: PageListOptions = {}): Promise<PageListResult> {
    const response = await this.wrapRequest(() => this.api.getPages(options));
    return resolveListResponse<ProductivePage, Page>(response);
  }

  /**
   * Get a single page by ID.
   */
  async get(id: string): Promise<PageGetResult> {
    const response = await this.wrapRequest(() => this.api.getPage(id));
    return resolveSingleResponse<ProductivePage, Page>(response);
  }

  /**
   * Create a new page.
   */
  async create(data: PageCreateData): Promise<PageGetResult> {
    const response = await this.wrapRequest(() => this.api.createPage(data));
    return resolveSingleResponse<ProductivePage, Page>(response);
  }

  /**
   * Update an existing page.
   */
  async update(id: string, data: PageUpdateData): Promise<PageGetResult> {
    const response = await this.wrapRequest(() => this.api.updatePage(id, data));
    return resolveSingleResponse<ProductivePage, Page>(response);
  }

  /**
   * Delete a page by ID.
   */
  async delete(id: string): Promise<void> {
    await this.wrapRequest(() => this.api.deletePage(id));
  }

  /**
   * Start a fluent query builder for pages, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Page, PageListResult> {
    return new QueryBuilder<Page, PageListResult>(this).filter(filters);
  }

  /**
   * Iterate over all pages across all pages.
   */
  all(options: Omit<PageListOptions, 'page'> = {}): AsyncPaginatedIterator<Page> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Page>(async (pageNum) => {
      return this.list({ ...options, page: pageNum, perPage });
    }, perPage);
  }
}
