/**
 * Response formatters for agent-friendly output
 *
 * This module re-exports formatters from @studiometa/productive-cli
 * with MCP-specific defaults (no relationship IDs, no timestamps).
 */

import {
  formatTimeEntry as cliFormatTimeEntry,
  formatProject as cliFormatProject,
  formatTask as cliFormatTask,
  formatPerson as cliFormatPerson,
  formatService as cliFormatService,
  formatListResponse as cliFormatListResponse,
  type JsonApiResource,
  type JsonApiMeta,
  type FormatOptions,
  type FormattedPagination,
} from '@studiometa/productive-cli';

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
 * Format time entry for agent consumption
 */
export function formatTimeEntry(
  entry: JsonApiResource,
  _included?: JsonApiResource[]
): Record<string, unknown> {
  return cliFormatTimeEntry(entry, MCP_FORMAT_OPTIONS);
}

/**
 * Format project for agent consumption
 */
export function formatProject(
  project: JsonApiResource,
  _included?: JsonApiResource[]
): Record<string, unknown> {
  return cliFormatProject(project, MCP_FORMAT_OPTIONS);
}

/**
 * Format task for agent consumption
 * Tasks use included resources to resolve project/company names
 */
export function formatTask(
  task: JsonApiResource,
  included?: JsonApiResource[]
): Record<string, unknown> {
  return cliFormatTask(task, { ...MCP_FORMAT_OPTIONS, included });
}

/**
 * Format person for agent consumption
 */
export function formatPerson(
  person: JsonApiResource,
  _included?: JsonApiResource[]
): Record<string, unknown> {
  return cliFormatPerson(person, MCP_FORMAT_OPTIONS);
}

/**
 * Format service for agent consumption
 */
export function formatService(
  service: JsonApiResource,
  _included?: JsonApiResource[]
): Record<string, unknown> {
  return cliFormatService(service, MCP_FORMAT_OPTIONS);
}

/**
 * Format list response with pagination
 *
 * @param data - Array of JSON:API resources
 * @param formatter - Formatter function (item, included?) => T
 * @param meta - Pagination metadata
 * @param included - Included resources for relationship resolution
 */
export function formatListResponse<T>(
  data: JsonApiResource[],
  formatter: (item: JsonApiResource, included?: JsonApiResource[]) => T,
  meta?: JsonApiMeta,
  included?: JsonApiResource[]
): { data: T[]; meta?: FormattedPagination } {
  // Create a wrapper that converts (item, options?) signature to (item, included?) signature
  const wrappedFormatter = (item: JsonApiResource, _options?: FormatOptions) => {
    return formatter(item, included);
  };

  const result = cliFormatListResponse(data, wrappedFormatter, meta, {
    ...MCP_FORMAT_OPTIONS,
    included,
  });

  return result as { data: T[]; meta?: FormattedPagination };
}
