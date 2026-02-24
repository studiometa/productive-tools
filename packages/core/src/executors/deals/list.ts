import type { ProductiveDeal } from '@studiometa/productive-api';

import { DEAL_BUDGET_STATUS, DEAL_STATUS, DEAL_TYPE } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListDealsOptions } from './types.js';

export function buildDealFilters(options: ListDealsOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.companyId) filter.company_id = options.companyId;
  if (options.projectId) filter.project_id = options.projectId;
  if (options.responsibleId) filter.responsible_id = options.responsibleId;
  if (options.pipelineId) filter.pipeline_id = options.pipelineId;

  if (options.status) {
    const mapped = DEAL_STATUS.toValue(options.status);
    if (mapped !== options.status.toLowerCase()) filter.stage_status_id = mapped;
  }
  if (options.dealType) {
    const mapped = DEAL_TYPE.toValue(options.dealType);
    if (mapped !== options.dealType.toLowerCase()) filter.type = mapped;
  }
  if (options.budgetStatus) {
    const mapped = DEAL_BUDGET_STATUS.toValue(options.budgetStatus);
    if (mapped !== options.budgetStatus.toLowerCase()) filter.budget_status = mapped;
  }

  return filter;
}

export async function listDeals(
  options: ListDealsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDeal[]>> {
  const filter = buildDealFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(filter);

  const response = await ctx.api.getDeals({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter: resolvedFilter,
    sort: options.sort,
    include: options.include ?? ['company', 'deal_status', 'responsible'],
  });

  return {
    data: response.data,
    meta: response.meta,
    included: response.included,
    resolved: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
