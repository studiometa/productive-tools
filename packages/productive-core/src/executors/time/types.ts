/**
 * Option types for time entry executors.
 *
 * These are explicit, typed interfaces — no more `string | boolean | undefined`.
 */

import type { PaginationOptions } from '../types.js';

/**
 * Options for listing time entries
 */
export interface ListTimeEntriesOptions extends PaginationOptions {
  /** Filter by person ID or human-friendly identifier (email, name) */
  personId?: string;
  /** Filter by project ID or human-friendly identifier (number, name) */
  projectId?: string;
  /** Filter by service ID or human-friendly identifier (name) */
  serviceId?: string;
  /** Filter by task ID */
  taskId?: string;
  /** Filter by company ID or human-friendly identifier (name) */
  companyId?: string;
  /** Filter by deal ID or human-friendly identifier (name, number) */
  dealId?: string;
  /** Filter by budget ID */
  budgetId?: string;
  /** Filter entries after this date (YYYY-MM-DD) */
  after?: string;
  /** Filter entries before this date (YYYY-MM-DD) */
  before?: string;
  /** Approval status: 'approved' | 'unapproved' | 'rejected' */
  status?: string;
  /** Billing type: 'fixed' | 'actuals' | 'non_billable' */
  billingType?: string;
  /** Invoicing status: 'not_invoiced' | 'drafted' | 'finalized' */
  invoicingStatus?: string;
  /** Additional raw filters to pass through */
  additionalFilters?: Record<string, string>;
}

/**
 * Options for getting a single time entry
 */
export interface GetTimeEntryOptions {
  /** Time entry ID */
  id: string;
}

/**
 * Options for creating a time entry
 */
export interface CreateTimeEntryOptions {
  /** Person ID or human-friendly identifier (email, name) */
  personId: string;
  /** Service ID or human-friendly identifier (name) */
  serviceId: string;
  /** Duration in minutes */
  time: number;
  /** Date (YYYY-MM-DD), defaults to today */
  date?: string;
  /** Optional note */
  note?: string;
  /** Optional task ID */
  taskId?: string;
  /** Project ID for service resolution context */
  projectId?: string;
}

/**
 * Options for updating a time entry
 */
export interface UpdateTimeEntryOptions {
  /** Time entry ID */
  id: string;
  /** New duration in minutes */
  time?: number;
  /** New date (YYYY-MM-DD) */
  date?: string;
  /** New note */
  note?: string;
}

/**
 * Options for deleting a time entry
 */
export interface DeleteTimeEntryOptions {
  /** Time entry ID */
  id: string;
}
