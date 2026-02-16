/**
 * List services executor.
 */

import type { ProductiveService } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListServicesOptions } from './types.js';

const BUDGET_STATUS_MAP: Record<string, string> = {
  open: '1',
  delivered: '2',
};

const BILLING_TYPE_MAP: Record<string, string> = {
  fixed: '1',
  actuals: '2',
  none: '3',
};

export function buildServicesFilters(options: ListServicesOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.projectId) filter.project_id = options.projectId;
  if (options.dealId) filter.deal_id = options.dealId;
  if (options.taskId) filter.task_id = options.taskId;
  if (options.personId) filter.person_id = options.personId;

  if (options.budgetStatus) {
    const mapped = BUDGET_STATUS_MAP[options.budgetStatus.toLowerCase()];
    if (mapped) filter.budget_status = mapped;
  }
  if (options.billingType) {
    const mapped = BILLING_TYPE_MAP[options.billingType.toLowerCase()];
    if (mapped) filter.billing_type = mapped;
  }
  if (options.timeTracking !== undefined) {
    filter.time_tracking_enabled = options.timeTracking ? 'true' : 'false';
  }

  return filter;
}

export async function listServices(
  options: ListServicesOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveService[]>> {
  const filter = buildServicesFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(filter);

  const response = await ctx.api.getServices({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter: resolvedFilter,
  });

  return {
    data: response.data,
    meta: response.meta,
    resolved: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
