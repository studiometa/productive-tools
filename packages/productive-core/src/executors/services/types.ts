/**
 * Option types for services executors.
 */

import type { PaginationOptions } from '../types.js';

export interface ListServicesOptions extends PaginationOptions {
  projectId?: string;
  dealId?: string;
  taskId?: string;
  personId?: string;
  /** Budget status: 'open' | 'delivered' */
  budgetStatus?: string;
  /** Billing type: 'fixed' | 'actuals' | 'none' */
  billingType?: string;
  /** Whether time tracking is enabled */
  timeTracking?: boolean;
  additionalFilters?: Record<string, string>;
}
