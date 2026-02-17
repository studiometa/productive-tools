/**
 * Project formatting
 */

import type { JsonApiResource, FormatOptions, FormattedProject } from './types.js';

import { DEFAULT_FORMAT_OPTIONS } from './types.js';

/**
 * Format a project resource for output
 */
export function formatProject(
  project: JsonApiResource,
  options: FormatOptions = {},
): FormattedProject {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = project.attributes;

  const result: FormattedProject = {
    id: project.id,
    name: attrs.name as string,
    number: (attrs.project_number as string) || null,
    archived: (attrs.archived as boolean) || false,
  };

  // Include budget if present
  if (attrs.budget !== undefined) {
    result.budget = attrs.budget as number;
  }

  // Include timestamps if requested
  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at as string | undefined;
    result.updated_at = attrs.updated_at as string | undefined;
  }

  return result;
}
