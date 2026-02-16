import type { ProductiveDeal } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { UpdateDealOptions } from './types.js';

import { ExecutorValidationError } from '../time/create.js';

export async function updateDeal(
  options: UpdateDealOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveDeal>> {
  const data: Record<string, string | undefined> = {};

  if (options.name !== undefined) data.name = options.name;
  if (options.date !== undefined) data.date = options.date;
  if (options.endDate !== undefined) data.end_date = options.endDate;
  if (options.responsibleId !== undefined) {
    data.responsible_id = await ctx.resolver.resolveValue(options.responsibleId, 'person');
  }
  if (options.dealStatusId !== undefined) data.deal_status_id = options.dealStatusId;

  if (Object.keys(data).length === 0) {
    throw new ExecutorValidationError(
      'No updates specified. Provide at least one field to update',
      'options',
    );
  }

  const response = await ctx.api.updateDeal(options.id, data);
  return { data: response.data };
}
