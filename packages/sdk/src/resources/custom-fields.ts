import type { ProductiveCustomField, ProductiveApiMeta } from '@studiometa/productive-api';

import type { CustomField } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface CustomFieldListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  include?: string[];
}

export interface CustomFieldListResult {
  data: CustomField[];
  meta: ProductiveApiMeta | undefined;
}

export interface CustomFieldGetResult {
  data: CustomField;
  meta: ProductiveApiMeta | undefined;
}

export class CustomFieldsCollection extends BaseCollection {
  /**
   * List custom field definitions with optional filtering, pagination, and includes.
   *
   * Common filters: `customizable_type` (Task, Deal, Company, etc.), `archived`, `name`.
   */
  async list(options: CustomFieldListOptions = {}): Promise<CustomFieldListResult> {
    const response = await this.wrapRequest(() => this.api.getCustomFields(options));
    return resolveListResponse<ProductiveCustomField, CustomField>(response);
  }

  /**
   * Get a single custom field definition by ID.
   *
   * Use `include: ['options']` to fetch select/multi-select option values.
   */
  async get(id: string, options: { include?: string[] } = {}): Promise<CustomFieldGetResult> {
    const response = await this.wrapRequest(() => this.api.getCustomField(id, options));
    return resolveSingleResponse<ProductiveCustomField, CustomField>(response);
  }

  /**
   * Start a fluent query builder for custom fields, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<CustomField, CustomFieldListResult> {
    return new QueryBuilder<CustomField, CustomFieldListResult>(this).filter(filters);
  }

  /**
   * Iterate over all custom field definitions across all pages.
   */
  all(options: Omit<CustomFieldListOptions, 'page'> = {}): AsyncPaginatedIterator<CustomField> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<CustomField>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
