import type { ProductiveService, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Service } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator, DEFAULT_PAGE_SIZE } from '../pagination.js';
import { QueryBuilder, type BaseListOptions } from '../query-builder.js';
import { BaseCollection } from './base.js';

export type ServiceListOptions = BaseListOptions;

export interface ServiceGetOptions {
  include?: string[];
}

export interface ServiceListResult {
  data: Service[];
  meta: ProductiveApiMeta | undefined;
}

export interface ServiceGetResult {
  data: Service;
  meta: ProductiveApiMeta | undefined;
}

export class ServicesCollection extends BaseCollection {
  /**
   * Get a single service by ID, with optional includes.
   */
  async get(id: string, options: ServiceGetOptions = {}): Promise<ServiceGetResult> {
    const response = await this.wrapRequest(() => this.api.getService(id, options));
    return resolveSingleResponse<ProductiveService, Service>(response);
  }

  /**
   * List services with optional filtering, pagination, and includes.
   */
  async list(options: ServiceListOptions = {}): Promise<ServiceListResult> {
    const response = await this.wrapRequest(() => this.api.getServices(options));
    return resolveListResponse<ProductiveService, Service>(response);
  }

  /**
   * Start a fluent query builder for services, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Service, ServiceListResult> {
    return new QueryBuilder<Service, ServiceListResult>(this).filter(filters);
  }

  /**
   * Iterate over all services across all pages.
   */
  all(options: Omit<ServiceListOptions, 'page'> = {}): AsyncPaginatedIterator<Service> {
    const perPage = options.perPage ?? DEFAULT_PAGE_SIZE;
    return new AsyncPaginatedIterator<Service>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
