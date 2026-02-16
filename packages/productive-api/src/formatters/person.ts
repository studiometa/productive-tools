/**
 * Person formatting
 */

import type { JsonApiResource, FormatOptions, FormattedPerson } from './types.js';

import { DEFAULT_FORMAT_OPTIONS } from './types.js';

/**
 * Format a person resource for output
 */
export function formatPerson(
  person: JsonApiResource,
  options: FormatOptions = {},
): FormattedPerson {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = person.attributes;

  const firstName = (attrs.first_name as string) || '';
  const lastName = (attrs.last_name as string) || '';

  const result: FormattedPerson = {
    id: person.id,
    name: `${firstName} ${lastName}`.trim(),
    first_name: firstName,
    last_name: lastName,
    email: (attrs.email as string) || '',
    active: (attrs.active as boolean) ?? true,
  };

  // Include title if present
  if (attrs.title !== undefined) {
    result.title = attrs.title as string;
  }

  // Include timestamps if requested
  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at as string | undefined;
    result.updated_at = attrs.updated_at as string | undefined;
  }

  return result;
}
