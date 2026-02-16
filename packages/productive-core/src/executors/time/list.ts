/**
 * List time entries executor.
 *
 * Pure business logic: builds filters, resolves identifiers, calls API.
 * No I/O side effects.
 */

import type { ProductiveTimeEntry } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListTimeEntriesOptions } from './types.js';

/** Status string → API value mapping */
const STATUS_MAP: Record<string, string> = {
  approved: '1',
  unapproved: '2',
  rejected: '3',
};

/** Billing type string → API value mapping */
const BILLING_TYPE_MAP: Record<string, string> = {
  fixed: '1',
  actuals: '2',
  non_billable: '3',
};

/** Invoicing status string → API value mapping */
const INVOICING_STATUS_MAP: Record<string, string> = {
  not_invoiced: '1',
  drafted: '2',
  finalized: '3',
};

/**
 * Build the filter object from typed options.
 * This is a pure function with no side effects.
 */
export function buildTimeEntryFilters(options: ListTimeEntriesOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  // Copy additional raw filters first (specific options override)
  if (options.additionalFilters) {
    Object.assign(filter, options.additionalFilters);
  }

  // Date range
  if (options.after) filter.after = options.after;
  if (options.before) filter.before = options.before;

  // Resource filters
  if (options.personId) filter.person_id = options.personId;
  if (options.projectId) filter.project_id = options.projectId;
  if (options.serviceId) filter.service_id = options.serviceId;
  if (options.taskId) filter.task_id = options.taskId;
  if (options.companyId) filter.company_id = options.companyId;
  if (options.dealId) filter.deal_id = options.dealId;
  if (options.budgetId) filter.budget_id = options.budgetId;

  // Enum-style filters
  if (options.status) {
    const mapped = STATUS_MAP[options.status.toLowerCase()];
    if (mapped) filter.status = mapped;
  }
  if (options.billingType) {
    const mapped = BILLING_TYPE_MAP[options.billingType.toLowerCase()];
    if (mapped) filter.billing_type_id = mapped;
  }
  if (options.invoicingStatus) {
    const mapped = INVOICING_STATUS_MAP[options.invoicingStatus.toLowerCase()];
    if (mapped) filter.invoicing_status = mapped;
  }

  return filter;
}

/**
 * List time entries.
 *
 * 1. Builds filter object from typed options
 * 2. Resolves human-friendly identifiers (emails, project numbers, etc.)
 * 3. Calls API with resolved filters and pagination
 * 4. Returns raw API data — formatting is the adapter's responsibility
 */
export async function listTimeEntries(
  options: ListTimeEntriesOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveTimeEntry[]>> {
  // Build filters from typed options
  const filter = buildTimeEntryFilters(options);

  // Resolve human-friendly identifiers
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(filter);

  // Call API
  const response = await ctx.api.getTimeEntries({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter: resolvedFilter,
    sort: options.sort,
  });

  return {
    data: response.data,
    meta: response.meta,
    resolved: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
