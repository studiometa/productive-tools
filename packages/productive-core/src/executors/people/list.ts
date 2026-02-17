/**
 * List people executor.
 */

import type { ProductivePerson } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListPeopleOptions } from './types.js';

const PERSON_TYPE_MAP: Record<string, string> = {
  user: '1',
  contact: '2',
  placeholder: '3',
};

const STATUS_MAP: Record<string, string> = {
  active: '1',
  deactivated: '2',
  inactive: '2',
};

export function buildPeopleFilters(options: ListPeopleOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.companyId) filter.company_id = options.companyId;
  if (options.projectId) filter.project_id = options.projectId;
  if (options.role) filter.role_id = options.role;
  if (options.team) filter.team = options.team;

  if (options.personType) {
    const mapped = PERSON_TYPE_MAP[options.personType.toLowerCase()];
    if (mapped) filter.person_type = mapped;
  }
  if (options.status) {
    const mapped = STATUS_MAP[options.status.toLowerCase()];
    if (mapped) filter.status = mapped;
  }

  return filter;
}

export async function listPeople(
  options: ListPeopleOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductivePerson[]>> {
  const filter = buildPeopleFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(filter);

  const response = await ctx.api.getPeople({
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
