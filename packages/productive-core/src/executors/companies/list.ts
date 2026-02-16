/**
 * List companies executor.
 */

import type { ProductiveCompany } from '@studiometa/productive-cli';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListCompaniesOptions } from './types.js';

export function buildCompanyFilters(options: ListCompaniesOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);

  if (options.archived === true) {
    filter.status = '2';
  } else if (options.archived === false || options.archived === undefined) {
    filter.status = '1';
  }

  return filter;
}

export async function listCompanies(
  options: ListCompaniesOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveCompany[]>> {
  const filter = buildCompanyFilters(options);

  const response = await ctx.api.getCompanies({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter,
    sort: options.sort,
  });

  return {
    data: response.data,
    meta: response.meta,
  };
}
