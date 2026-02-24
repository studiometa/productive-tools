/**
 * List projects executor.
 */

import type { ProductiveProject } from '@studiometa/productive-api';

import { PROJECT_STATUS, PROJECT_TYPE } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListProjectsOptions } from './types.js';

/**
 * Build the filter object from typed options.
 */
export function buildProjectFilters(options: ListProjectsOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) {
    Object.assign(filter, options.additionalFilters);
  }

  if (options.companyId) filter.company_id = options.companyId;
  if (options.responsibleId) filter.responsible_id = options.responsibleId;
  if (options.personId) filter.person_id = options.personId;

  if (options.projectType) {
    const mapped = PROJECT_TYPE.toValue(options.projectType);
    if (mapped !== options.projectType.toLowerCase()) filter.project_type = mapped;
  }
  if (options.status) {
    const mapped = PROJECT_STATUS.toValue(options.status);
    if (mapped !== options.status.toLowerCase()) filter.status = mapped;
  }

  return filter;
}

/**
 * List projects.
 */
export async function listProjects(
  options: ListProjectsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveProject[]>> {
  const filter = buildProjectFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(filter);

  const response = await ctx.api.getProjects({
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
