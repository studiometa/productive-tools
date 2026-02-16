/**
 * Service formatting
 */

import type { JsonApiResource, FormatOptions, FormattedService } from './types.js';

import { DEFAULT_FORMAT_OPTIONS } from './types.js';

/**
 * Format a service resource for output
 */
export function formatService(
  service: JsonApiResource,
  options: FormatOptions = {},
): FormattedService {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = service.attributes;

  const result: FormattedService = {
    id: service.id,
    name: (attrs.name as string) || '',
  };

  // Include time tracking fields if present
  if (attrs.budgeted_time !== undefined) {
    result.budgeted_time = attrs.budgeted_time as number;
  }
  if (attrs.worked_time !== undefined) {
    result.worked_time = attrs.worked_time as number;
  }

  // Include timestamps if requested
  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at as string | undefined;
    result.updated_at = attrs.updated_at as string | undefined;
  }

  return result;
}
