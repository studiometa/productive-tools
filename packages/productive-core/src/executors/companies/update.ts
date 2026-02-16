/**
 * Update a company executor.
 */

import type { ProductiveCompany } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { UpdateCompanyOptions } from './types.js';

import { ExecutorValidationError } from '../time/create.js';

export async function updateCompany(
  options: UpdateCompanyOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveCompany>> {
  const data: Record<string, string | number | undefined> = {};

  if (options.name !== undefined) data.name = options.name;
  if (options.billingName !== undefined) data.billing_name = options.billingName;
  if (options.vat !== undefined) data.vat = options.vat;
  if (options.defaultCurrency !== undefined) data.default_currency = options.defaultCurrency;
  if (options.companyCode !== undefined) data.company_code = options.companyCode;
  if (options.domain !== undefined) data.domain = options.domain;
  if (options.dueDays !== undefined) data.due_days = options.dueDays;

  if (Object.keys(data).length === 0) {
    throw new ExecutorValidationError(
      'No updates specified. Provide at least one field to update',
      'options',
    );
  }

  const response = await ctx.api.updateCompany(options.id, data);
  return { data: response.data };
}
