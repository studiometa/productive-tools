/**
 * List services executor.
 */

import type { ProductiveService } from '@studiometa/productive-api';

import { SERVICE_BILLING_TYPE, SERVICE_BUDGET_STATUS } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListServicesOptions } from './types.js';

export function buildServicesFilters(options: ListServicesOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.projectId) filter.project_id = options.projectId;
  if (options.dealId) filter.deal_id = options.dealId;
  if (options.taskId) filter.task_id = options.taskId;
  if (options.personId) filter.person_id = options.personId;

  if (options.budgetStatus) {
    const mapped = SERVICE_BUDGET_STATUS.toValue(options.budgetStatus);
    if (mapped !== options.budgetStatus.toLowerCase()) filter.budget_status = mapped;
  }
  if (options.billingType) {
    const mapped = SERVICE_BILLING_TYPE.toValue(options.billingType);
    if (mapped !== options.billingType.toLowerCase()) filter.billing_type = mapped;
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
