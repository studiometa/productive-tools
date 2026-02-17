import type { PaginationOptions } from '../types.js';

export interface ListBudgetsOptions extends PaginationOptions {
  projectId?: string;
  companyId?: string;
  dealId?: string;
  billable?: boolean;
  budgetType?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetBudgetOptions {
  id: string;
}
