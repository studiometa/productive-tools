import type { ProductiveDeal, ProductiveApiMeta } from '@studiometa/productive-api';

import type { ResolvedResource } from '../json-api.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
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
  data: ResolvedResource[];
  meta: ProductiveApiMeta | undefined;
}

export interface DealGetResult {
  data: ResolvedResource;
  meta: ProductiveApiMeta | undefined;
}

export class DealsCollection extends BaseCollection {
  /**
   * List deals with optional filtering, pagination, and includes.
   */
  async list(options: DealListOptions = {}): Promise<DealListResult> {
    const response = await this.api.getDeals(options);
    return resolveListResponse<ProductiveDeal>(response);
  }

  /**
   * Get a single deal by ID, with optional includes.
   */
  async get(id: string, options: DealGetOptions = {}): Promise<DealGetResult> {
    const response = await this.api.getDeal(id, options);
    return resolveSingleResponse<ProductiveDeal>(response);
  }

  /**
   * Create a new deal.
   */
  async create(data: DealCreateData): Promise<DealGetResult> {
    const response = await this.api.createDeal(data);
    return resolveSingleResponse<ProductiveDeal>(response);
  }

  /**
   * Update an existing deal.
   */
  async update(id: string, data: DealUpdateData): Promise<DealGetResult> {
    const response = await this.api.updateDeal(id, data);
    return resolveSingleResponse<ProductiveDeal>(response);
  }

  /**
   * Iterate over all deals across all pages.
   */
  all(options: Omit<DealListOptions, 'page'> = {}): AsyncPaginatedIterator<ResolvedResource> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<ResolvedResource>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
