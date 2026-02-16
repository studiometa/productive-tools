import type { ProductiveDeal } from '@studiometa/productive-cli';

import type { ExecutorContext, ResolvableResourceType } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListDealsOptions } from './types.js';

const STATUS_MAP: Record<string, string> = { open: '1', won: '2', lost: '3' };
const TYPE_MAP: Record<string, string> = { deal: '1', budget: '2' };
const BUDGET_STATUS_MAP: Record<string, string> = { open: '1', closed: '2' };

const FILTER_TYPE_MAPPING: Record<string, ResolvableResourceType> = {
  company_id: 'company',
  project_id: 'project',
  responsible_id: 'person',
};

export function buildDealFilters(options: ListDealsOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.companyId) filter.company_id = options.companyId;
  if (options.projectId) filter.project_id = options.projectId;
  if (options.responsibleId) filter.responsible_id = options.responsibleId;
  if (options.pipelineId) filter.pipeline_id = options.pipelineId;

  if (options.status) {
    const mapped = STATUS_MAP[options.status.toLowerCase()];
    if (mapped) filter.stage_status_id = mapped;
  }
  if (options.dealType) {
    const mapped = TYPE_MAP[options.dealType.toLowerCase()];
    if (mapped) filter.type = mapped;
  }
  if (options.budgetStatus) {
    const mapped = BUDGET_STATUS_MAP[options.budgetStatus.toLowerCase()];
    if (mapped) filter.budget_status = mapped;
  }

  return filter;
}

export async function listDeals(
  options: ListDealsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDeal[]>> {
  const filter = buildDealFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(
    filter,
    FILTER_TYPE_MAPPING,
  );

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
