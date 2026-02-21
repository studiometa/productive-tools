import type { PaginationOptions } from '../types.js';

export interface ListDealsOptions extends PaginationOptions {
  companyId?: string;
  projectId?: string;
  responsibleId?: string;
  pipelineId?: string;
  /** Status: 'open' | 'won' | 'lost' */
  status?: string;
  /** Type: 'deal' | 'budget' */
  dealType?: string;
  /** Budget status: 'open' | 'closed' */
  budgetStatus?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetDealOptions {
  id: string;
  include?: string[];
}

export interface CreateDealOptions {
  name: string;
  companyId: string;
  date?: string;
  budget?: boolean;
  responsibleId?: string;
}

export interface UpdateDealOptions {
  id: string;
  name?: string;
  date?: string;
  endDate?: string;
  responsibleId?: string;
  dealStatusId?: string;
}

export interface GetDealContextOptions {
  id: string;
}

export interface DealContextResult {
  deal: import('@studiometa/productive-api').ProductiveDeal;
  services: import('@studiometa/productive-api').ProductiveService[];
  comments: import('@studiometa/productive-api').ProductiveComment[];
  time_entries: import('@studiometa/productive-api').ProductiveTimeEntry[];
}
