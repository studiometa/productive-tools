/**
 * List custom fields executor.
 */

import type { ProductiveCustomField } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListCustomFieldsOptions } from './types.js';

export async function listCustomFields(
  options: ListCustomFieldsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveCustomField[]>> {
  const filter: Record<string, string> = {};

  if (options.customizable_type) {
    filter.customizable_type = options.customizable_type;
  }

  if (options.archived !== undefined) {
    filter.archived = String(options.archived);
  }

  if (options.additionalFilters) {
    Object.assign(filter, options.additionalFilters);
  }

  const response = await ctx.api.getCustomFields({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    include: options.include,
  });

  return {
    data: response.data,
    meta: response.meta,
    included: response.included,
  };
}
