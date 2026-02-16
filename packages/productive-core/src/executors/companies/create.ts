/**
 * Create a company executor.
 */

import type { ProductiveCompany } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CreateCompanyOptions } from './types.js';

export async function createCompany(
  options: CreateCompanyOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveCompany>> {
  const response = await ctx.api.createCompany({
    name: options.name,
    billing_name: options.billingName,
    vat: options.vat,
    default_currency: options.defaultCurrency,
    company_code: options.companyCode,
    domain: options.domain,
    due_days: options.dueDays,
  });

  return { data: response.data };
}
