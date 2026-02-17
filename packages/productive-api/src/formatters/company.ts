/**
 * Formatter for Company resources
 */

import type { JsonApiResource, FormatOptions } from './types.js';

import { DEFAULT_FORMAT_OPTIONS } from './types.js';

export interface FormattedCompany {
  [key: string]: unknown;
  id: string;
  name: string;
  billing_name: string | null;
  company_code: string | null;
  vat: string | null;
  default_currency: string | null;
  domain: string | null;
  due_days: number | null;
  archived: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Format a Company resource for output
 */
export function formatCompany(company: JsonApiResource, options?: FormatOptions): FormattedCompany {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = company.attributes;

  const result: FormattedCompany = {
    id: company.id,
    name: String(attrs.name || ''),
    billing_name: attrs.billing_name ? String(attrs.billing_name) : null,
    company_code: attrs.company_code ? String(attrs.company_code) : null,
    vat: attrs.vat ? String(attrs.vat) : null,
    default_currency: attrs.default_currency ? String(attrs.default_currency) : null,
    domain: attrs.domain ? String(attrs.domain) : null,
    due_days: attrs.due_days != null ? Number(attrs.due_days) : null,
    archived: !!attrs.archived_at,
  };

  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at ? String(attrs.created_at) : undefined;
    result.updated_at = attrs.updated_at ? String(attrs.updated_at) : undefined;
  }

  return result;
}
