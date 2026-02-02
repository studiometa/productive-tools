/**
 * Formatter for Deal resources
 */

import type { JsonApiResource, FormatOptions } from './types.js';

import { DEFAULT_FORMAT_OPTIONS } from './types.js';

export interface FormattedDeal {
  [key: string]: unknown;
  id: string;
  name: string;
  number: string | null;
  type: 'deal' | 'budget';
  date: string | null;
  end_date: string | null;
  won_at: string | null;
  lost_at: string | null;
  company_id?: string;
  company_name?: string;
  responsible_id?: string;
  responsible_name?: string;
  status_id?: string;
  status_name?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get included resource by type and id
 */
function getIncludedResource(
  included: JsonApiResource[] | undefined,
  type: string,
  id: string | undefined,
): Record<string, unknown> | undefined {
  if (!included || !id) return undefined;
  return included.find((r) => r.type === type && r.id === id)?.attributes;
}

/**
 * Format a Deal resource for output
 */
export function formatDeal(deal: JsonApiResource, options?: FormatOptions): FormattedDeal {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = deal.attributes;

  // Get related resources from includes
  const companyId = deal.relationships?.company?.data?.id;
  const companyData = getIncludedResource(opts.included, 'companies', companyId);

  const responsibleId = deal.relationships?.responsible?.data?.id;
  const responsibleData = getIncludedResource(opts.included, 'people', responsibleId);

  const statusId = deal.relationships?.deal_status?.data?.id;
  const statusData = getIncludedResource(opts.included, 'deal_statuses', statusId);

  const result: FormattedDeal = {
    id: deal.id,
    name: String(attrs.name || ''),
    number: attrs.number ? String(attrs.number) : null,
    type: attrs.budget ? 'budget' : 'deal',
    date: attrs.date ? String(attrs.date) : null,
    end_date: attrs.end_date ? String(attrs.end_date) : null,
    won_at: attrs.won_at ? String(attrs.won_at) : null,
    lost_at: attrs.lost_at ? String(attrs.lost_at) : null,
  };

  if (opts.includeRelationshipIds) {
    if (companyId) result.company_id = companyId;
    if (responsibleId) result.responsible_id = responsibleId;
    if (statusId) result.status_id = statusId;
  }

  if (companyData) {
    result.company_name = String(companyData.name || '');
  }

  if (responsibleData) {
    result.responsible_name = `${responsibleData.first_name} ${responsibleData.last_name}`;
  }

  if (statusData) {
    result.status_name = String(statusData.name || '');
  }

  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at ? String(attrs.created_at) : undefined;
    result.updated_at = attrs.updated_at ? String(attrs.updated_at) : undefined;
  }

  return result;
}
