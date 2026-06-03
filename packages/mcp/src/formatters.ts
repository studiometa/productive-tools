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
  formatCompany as cliFormatCompany,
  formatComment as cliFormatComment,
  formatTimer as cliFormatTimer,
  formatDeal as cliFormatDeal,
  formatBooking as cliFormatBooking,
  formatAttachment as cliFormatAttachment,
  formatPage as cliFormatPage,
  formatDiscussion as cliFormatDiscussion,
  formatActivity as cliFormatActivity,
  formatCustomField as cliFormatCustomField,
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
 * Build the CLI formatter options for an MCP wrapper: the MCP defaults plus any
 * sideloaded `included` array carried over, so each formatter forwards
 * relationships with a single shared call instead of repeating the spread.
 */
export function withIncluded(options?: McpFormatOptions): FormatOptions {
  return { ...MCP_FORMAT_OPTIONS, included: options?.included };
}

/**
 * Format time entry for agent consumption
 */
export function formatTimeEntry(
  entry: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatTimeEntry(entry, withIncluded(options));
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
  const result = cliFormatProject(project, withIncluded(options));
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
  const result = cliFormatTask(task, withIncluded(options));
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
  const result = cliFormatPerson(person, withIncluded(options));
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
  const result = cliFormatService(service, withIncluded(options));
  if (options?.compact) {
    return compactify(result, ['budgeted_time', 'worked_time']);
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
  const result = cliFormatCompany(company, withIncluded(options));
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
  const result = cliFormatComment(comment, withIncluded(options));
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
  const result = cliFormatDeal(deal, withIncluded(options));
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
  const result = cliFormatBooking(booking, withIncluded(options));
  if (options?.compact) {
    return compactify(result, ['approved_at', 'rejected_at', 'rejected_reason']);
  }
  return result;
}

/**
 * Format attachment for agent consumption
 */
export function formatAttachment(
  attachment: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatAttachment(attachment, withIncluded(options));
  if (options?.compact) {
    return compactify(result, ['url']);
  }
  return result;
}

/**
 * Format page for agent consumption
 */
export function formatPage(
  page: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatPage(page, withIncluded(options));
  if (options?.compact) {
    return compactify(result, ['body', 'version_number']);
  }
  return result;
}

/**
 * Format discussion for agent consumption
 */
export function formatDiscussion(
  discussion: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  const result = cliFormatDiscussion(discussion, withIncluded(options));
  if (options?.compact) {
    return compactify(result, ['body']);
  }
  return result;
}

export function formatActivity(
  activity: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  return cliFormatActivity(activity, withIncluded(options));
}

/**
 * Format custom field for agent consumption
 */
export function formatCustomField(
  field: JsonApiResource,
  options?: McpFormatOptions,
): Record<string, unknown> {
  return cliFormatCustomField(field, withIncluded(options));
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

  const result = cliFormatListResponse(data, wrappedFormatter, meta, withIncluded(options));

  return result as { data: T[]; meta?: FormattedPagination };
}
