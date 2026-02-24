/**
 * List time entries executor.
 *
 * Pure business logic: builds filters, resolves identifiers, calls API.
 * No I/O side effects.
 */

import type { ProductiveTimeEntry } from '@studiometa/productive-api';

import { TIME_BILLING_TYPE, TIME_INVOICING_STATUS, TIME_STATUS } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListTimeEntriesOptions } from './types.js';

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
    const mapped = TIME_STATUS.toValue(options.status);
    if (mapped !== options.status.toLowerCase()) filter.status = mapped;
  }
  if (options.billingType) {
    const mapped = TIME_BILLING_TYPE.toValue(options.billingType);
    if (mapped !== options.billingType.toLowerCase()) filter.billing_type_id = mapped;
  }
  if (options.invoicingStatus) {
    const mapped = TIME_INVOICING_STATUS.toValue(options.invoicingStatus);
    if (mapped !== options.invoicingStatus.toLowerCase()) filter.invoicing_status = mapped;
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
