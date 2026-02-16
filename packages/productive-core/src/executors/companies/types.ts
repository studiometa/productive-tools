/**
 * Option types for companies executors.
 */

import type { PaginationOptions } from '../types.js';

export interface ListCompaniesOptions extends PaginationOptions {
  /** Whether to show archived companies */
  archived?: boolean;
  additionalFilters?: Record<string, string>;
}

export interface GetCompanyOptions {
  /** Company ID or human-friendly identifier (name) */
  id: string;
}

export interface CreateCompanyOptions {
  name: string;
  billingName?: string;
  vat?: string;
  defaultCurrency?: string;
  companyCode?: string;
  domain?: string;
  dueDays?: number;
}

export interface UpdateCompanyOptions {
  id: string;
  name?: string;
  billingName?: string;
  vat?: string;
  defaultCurrency?: string;
  companyCode?: string;
  domain?: string;
  dueDays?: number;
}
