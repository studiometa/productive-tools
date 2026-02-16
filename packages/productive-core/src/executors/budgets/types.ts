import type { PaginationOptions } from '../types.js';

export interface ListBudgetsOptions extends PaginationOptions {
  projectId?: string;
  companyId?: string;
  additionalFilters?: Record<string, string>;
}
