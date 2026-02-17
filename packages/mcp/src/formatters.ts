/**
 * Response formatters for agent-friendly output
 *
 * This module re-exports formatters from @studiometa/productive-api
 * with MCP-specific defaults (no relationship IDs, no timestamps).
 *
 * Supports compact mode to reduce token usage by omitting verbose fields
 * like descriptions and notes from list responses.
 */

import {
  formatTimeEntry as cliFormatTimeEntry,
  formatProject as cliFormatProject,
  formatTask as cliFormatTask,
  formatPerson as cliFormatPerson,
  formatService as cliFormatService,
  formatBudget as cliFormatBudget,
  formatCompany as cliFormatCompany,
  formatComment as cliFormatComment,
  formatTimer as cliFormatTimer,
  formatDeal as cliFormatDeal,
  formatBooking as cliFormatBooking,
  formatListResponse as cliFormatListResponse,
  type JsonApiResource,
  type JsonApiMeta,
  type FormatOptions,
  type FormattedPagination,
} from '@studiometa/productive-api';

// Re-export types
export type { JsonApiResource, JsonApiMeta, FormatOptions, FormattedPagination };

/**
 * MCP-specific format options
 * - No relationship IDs (cleaner output for agents)
 * - No timestamps (reduce noise)
 * - HTML stripping enabled
 */
const MCP_FORMAT_OPTIONS: FormatOptions = {
  includeRelationshipIds: false,
  includeTimestamps: false,
  stripHtml: true,
};

/**
 * Extended format options for MCP with compact mode
 */
export interface McpFormatOptions {
  compact?: boolean;
  included?: JsonApiResource[];
}

/**
 * Remove verbose fields from an object for compact output
 */
function compactify<T extends Record<string, unknown>>(obj: T, fieldsToRemove: string[]): T {
  const result = { ...obj };
  for (const field of fieldsToRemove) {
    delete result[field];
  }
  return result;
}

/**
 * Format time entry for agent consumption
 */
export function formatTimeEntry(
  entry: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatTimeEntry(entry, MCP_FORMAT_OPTIONS);
  if (options?.compact) {
    return compactify(result, ['note', 'billable_time', 'approved']);
  }
  return result;
}

/**
 * Format project for agent consumption
 */
export function formatProject(
  project: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatProject(project, MCP_FORMAT_OPTIONS);
  if (options?.compact) {
    return compactify(result, ['budget']);
  }
  return result;
}

/**
 * Format task for agent consumption
 * Tasks use included resources to resolve project/company names
 */
export function formatTask(
  task: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatTask(task, { ...MCP_FORMAT_OPTIONS, included: options?.included });
  if (options?.compact) {
    return compactify(result, [
      'description',
      'initial_estimate',
      'worked_time',
      'remaining_time',
      'project', // Keep project_name but remove nested object
      'company', // Keep company name inline if needed
    ]);
  }
  return result;
}

/**
 * Format person for agent consumption
 */
export function formatPerson(
  person: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatPerson(person, MCP_FORMAT_OPTIONS);
  if (options?.compact) {
    return compactify(result, ['title', 'first_name', 'last_name']); // Keep 'name' which combines them
  }
  return result;
}

/**
 * Format service for agent consumption
 */
export function formatService(
  service: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatService(service, MCP_FORMAT_OPTIONS);
  if (options?.compact) {
    return compactify(result, ['budgeted_time', 'worked_time']);
  }
  return result;
}

/**
 * Format budget for agent consumption
 */
export function formatBudget(
  budget: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatBudget(budget, MCP_FORMAT_OPTIONS);
  if (options?.compact) {
    return compactify(result, ['budget_type', 'currency']);
  }
  return result;
}

/**
 * Format company for agent consumption
 */
export function formatCompany(
  company: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatCompany(company, MCP_FORMAT_OPTIONS);
  if (options?.compact) {
    return compactify(result, ['billing_name', 'domain', 'due_days']);
  }
  return result;
}

/**
 * Format comment for agent consumption
 */
export function formatComment(
  comment: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatComment(comment, { ...MCP_FORMAT_OPTIONS, included: options?.included });
  return result;
}

/**
 * Format timer for agent consumption
 */
export function formatTimer(
  timer: JsonApiResource,
  _options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatTimer(timer, MCP_FORMAT_OPTIONS);
  return result;
}

/**
 * Format deal for agent consumption
 */
export function formatDeal(
  deal: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatDeal(deal, { ...MCP_FORMAT_OPTIONS, included: options?.included });
  if (options?.compact) {
    return compactify(result, ['won_at', 'lost_at']);
  }
  return result;
}

/**
 * Format booking for agent consumption
 */
export function formatBooking(
  booking: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatBooking(booking, { ...MCP_FORMAT_OPTIONS, included: options?.included });
  if (options?.compact) {
    return compactify(result, ['approved_at', 'rejected_at', 'rejected_reason']);
  }
  return result;
}

/**
 * Format list response with pagination
 *
 * @param data - Array of JSON:API resources
 * @param formatter - Formatter function (item, options?) => T
 * @param meta - Pagination metadata
 * @param options - MCP format options (compact, included)
 */
export function formatListResponse<T>(
  data: JsonApiResource[],
  formatter: (item: JsonApiResource, options?: McpFormatOptions) => T,
  meta?: JsonApiMeta,
  options?: McpFormatOptions,
): { data: T[]; meta?: FormattedPagination } {
  // Create a wrapper that passes MCP options to the formatter
  const wrappedFormatter = (item: JsonApiResource, _cliOptions?: FormatOptions) => {
    return formatter(item, options);
  };

  const result = cliFormatListResponse(data, wrappedFormatter, meta, {
    ...MCP_FORMAT_OPTIONS,
    included: options?.included,
  });

  return result as { data: T[]; meta?: FormattedPagination };
}
