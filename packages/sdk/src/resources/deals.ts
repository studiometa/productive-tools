import type { ProductiveDeal, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Deal } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface DealListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
  include?: string[];
}

export interface DealGetOptions {
  include?: string[];
}

export interface DealCreateData {
  name: string;
  company_id: string;
  date?: string;
  budget?: boolean;
  responsible_id?: string;
}

export interface DealUpdateData {
  name?: string;
  date?: string;
  end_date?: string;
  responsible_id?: string;
  deal_status_id?: string;
}

export interface DealListResult {
  data: Deal[];
  meta: ProductiveApiMeta | undefined;
}

export interface DealGetResult {
  data: Deal;
  meta: ProductiveApiMeta | undefined;
}

export class DealsCollection extends BaseCollection {
  /**
   * List deals with optional filtering, pagination, and includes.
   */
  async list(options: DealListOptions = {}): Promise<DealListResult> {
    const response = await this.wrapRequest(() => this.api.getDeals(options));
    return resolveListResponse<ProductiveDeal, Deal>(response);
  }

  /**
   * Get a single deal by ID, with optional includes.
   */
  async get(id: string, options: DealGetOptions = {}): Promise<DealGetResult> {
    const response = await this.wrapRequest(() => this.api.getDeal(id, options));
    return resolveSingleResponse<ProductiveDeal, Deal>(response);
  }

  /**
   * Create a new deal.
   */
  async create(data: DealCreateData): Promise<DealGetResult> {
    const response = await this.wrapRequest(() => this.api.createDeal(data));
    return resolveSingleResponse<ProductiveDeal, Deal>(response);
  }

  /**
   * Update an existing deal.
   */
  async update(id: string, data: DealUpdateData): Promise<DealGetResult> {
    const response = await this.wrapRequest(() => this.api.updateDeal(id, data));
    return resolveSingleResponse<ProductiveDeal, Deal>(response);
  }

  /**
   * Start a fluent query builder for deals, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Deal, DealListResult> {
    return new QueryBuilder<Deal, DealListResult>(this).filter(filters);
  }

  /**
   * Iterate over all deals across all pages.
   */
  all(options: Omit<DealListOptions, 'page'> = {}): AsyncPaginatedIterator<Deal> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Deal>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
