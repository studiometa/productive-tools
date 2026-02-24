import type { ProductiveCompany, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Company } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { BaseCollection } from './base.js';

export interface CompanyListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
}

export interface CompanyCreateData {
  name: string;
  billing_name?: string;
  vat?: string;
  default_currency?: string;
  company_code?: string;
  domain?: string;
  due_days?: number;
}

export interface CompanyUpdateData {
  name?: string;
  billing_name?: string;
  vat?: string;
  default_currency?: string;
  company_code?: string;
  domain?: string;
  due_days?: number;
}

export interface CompanyListResult {
  data: Company[];
  meta: ProductiveApiMeta | undefined;
}

export interface CompanyGetResult {
  data: Company;
  meta: ProductiveApiMeta | undefined;
}

export class CompaniesCollection extends BaseCollection {
  /**
   * List companies with optional filtering and pagination.
   */
  async list(options: CompanyListOptions = {}): Promise<CompanyListResult> {
    const response = await this.api.getCompanies(options);
    return resolveListResponse<ProductiveCompany, Company>(response);
  }

  /**
   * Get a single company by ID.
   */
  async get(id: string): Promise<CompanyGetResult> {
    const response = await this.api.getCompany(id);
    return resolveSingleResponse<ProductiveCompany, Company>(response);
  }

  /**
   * Create a new company.
   */
  async create(data: CompanyCreateData): Promise<CompanyGetResult> {
    const response = await this.api.createCompany(data);
    return resolveSingleResponse<ProductiveCompany, Company>(response);
  }

  /**
   * Update an existing company.
   */
  async update(id: string, data: CompanyUpdateData): Promise<CompanyGetResult> {
    const response = await this.api.updateCompany(id, data);
    return resolveSingleResponse<ProductiveCompany, Company>(response);
  }

  /**
   * Iterate over all companies across all pages.
   */
  all(options: Omit<CompanyListOptions, 'page'> = {}): AsyncPaginatedIterator<Company> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Company>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
