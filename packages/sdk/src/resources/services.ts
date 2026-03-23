import type { ProductiveService, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Service } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface ServiceListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
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
   * Get a single service by ID.
   */
  async get(id: string): Promise<ServiceGetResult> {
    const response = await this.wrapRequest(() => this.api.getService(id));
    return resolveSingleResponse<ProductiveService, Service>(response);
  }

  /**
   * List services with optional filtering and pagination.
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
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Service>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
