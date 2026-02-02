/**
 * Formatters for Productive.io API responses
 *
 * These formatters transform verbose JSON:API responses into clean,
 * structured data suitable for both CLI and MCP outputs.
 */

// Types
export type {
  JsonApiResource,
  JsonApiResponse,
  JsonApiMeta,
  FormattedPagination,
  FormatOptions,
  FormattedListResponse,
  FormattedTimeEntry,
  FormattedProject,
  FormattedTask,
  FormattedPerson,
  FormattedService,
  FormattedBudget,
} from './types.js';

export type { FormattedCompany } from './company.js';
export type { FormattedComment } from './comment.js';
export type { FormattedTimer } from './timer.js';
export type { FormattedDeal } from './deal.js';
export type { FormattedBooking } from './booking.js';

export { DEFAULT_FORMAT_OPTIONS } from './types.js';

// Formatters
export { formatTimeEntry } from './time-entry.js';
export { formatProject } from './project.js';
export { formatTask } from './task.js';
export { formatPerson } from './person.js';
export { formatService } from './service.js';
export { formatBudget } from './budget.js';
export { formatCompany } from './company.js';
export { formatComment } from './comment.js';
export { formatTimer } from './timer.js';
export { formatDeal } from './deal.js';
export { formatBooking } from './booking.js';

// Pagination
export { formatPagination, hasMorePages } from './pagination.js';

// Re-export HTML utilities used by formatters
export { stripHtml } from '../utils/html.js';

// ============================================================================
// List formatting utilities
// ============================================================================

import type {
  JsonApiResource,
  JsonApiMeta,
  FormatOptions,
  FormattedListResponse,
} from './types.js';
import { formatPagination } from './pagination.js';

/**
 * Format a list response with pagination
 *
 * @param data - Array of JSON:API resources
 * @param formatter - Function to format each resource
 * @param meta - JSON:API metadata (for pagination)
 * @param options - Formatting options (passed to each formatter)
 * @returns Formatted list with clean pagination
 *
 * @example
 * ```typescript
 * const response = await api.getProjects();
 * const formatted = formatListResponse(
 *   response.data,
 *   formatProject,
 *   response.meta
 * );
 * // { data: [...], meta: { page: 1, total_pages: 5, total_count: 100 } }
 * ```
 */
export function formatListResponse<T>(
  data: JsonApiResource[],
  formatter: (item: JsonApiResource, options?: FormatOptions) => T,
  meta?: JsonApiMeta,
  options?: FormatOptions
): FormattedListResponse<T> {
  // Pass included resources to formatter via options
  const formatOptions: FormatOptions = {
    ...options,
    included: options?.included,
  };

  const result: FormattedListResponse<T> = {
    data: data.map((item) => formatter(item, formatOptions)),
  };

  const pagination = formatPagination(meta);
  if (pagination) {
    result.meta = pagination;
  }

  return result;
}

/**
 * Format a single resource response
 *
 * @param data - JSON:API resource
 * @param formatter - Function to format the resource
 * @param options - Formatting options
 * @returns Formatted resource
 */
export function formatSingleResponse<T>(
  data: JsonApiResource,
  formatter: (item: JsonApiResource, options?: FormatOptions) => T,
  options?: FormatOptions
): T {
  return formatter(data, options);
}

// ============================================================================
// Generic formatter (auto-detect type)
// ============================================================================

import { formatTimeEntry } from './time-entry.js';
import { formatProject } from './project.js';
import { formatTask } from './task.js';
import { formatPerson } from './person.js';
import { formatService } from './service.js';
import { formatBudget } from './budget.js';
import { formatCompany } from './company.js';
import { formatComment } from './comment.js';
import { formatTimer } from './timer.js';
import { formatDeal } from './deal.js';
import { formatBooking } from './booking.js';

/**
 * Get the appropriate formatter function for a resource type
 */
function getFormatterForType(
  type?: string
): (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown> {
  switch (type) {
    case 'time_entries':
      return formatTimeEntry as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'tasks':
      return formatTask as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'projects':
      return formatProject as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'people':
      return formatPerson as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'services':
      return formatService as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'budgets':
      return formatBudget as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'companies':
      return formatCompany as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'comments':
      return formatComment as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'timers':
      return formatTimer as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'deals':
      return formatDeal as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    case 'bookings':
      return formatBooking as (item: JsonApiResource, options?: FormatOptions) => Record<string, unknown>;
    default:
      // Generic formatter: flatten id + attributes
      return (item: JsonApiResource) => ({
        id: item.id,
        ...item.attributes,
      });
  }
}

/**
 * Auto-format a JSON:API response based on resource type
 *
 * @param response - JSON:API response
 * @param options - Formatting options
 * @returns Formatted data (single resource or list with pagination)
 */
export function formatResponse(
  response: { data: JsonApiResource | JsonApiResource[]; meta?: JsonApiMeta; included?: JsonApiResource[] },
  options?: FormatOptions
): unknown {
  const formatOptions: FormatOptions = {
    ...options,
    included: response.included,
  };

  if (Array.isArray(response.data)) {
    const type = response.data[0]?.type;
    const formatter = getFormatterForType(type);
    return formatListResponse(response.data, formatter, response.meta, formatOptions);
  } else {
    const formatter = getFormatterForType(response.data.type);
    return formatSingleResponse(response.data, formatter, formatOptions);
  }
}
