/**
 * Time entry formatting
 */

import { stripHtml } from '../utils/html.js';
import type {
  JsonApiResource,
  FormatOptions,
  FormattedTimeEntry,
} from './types.js';
import { DEFAULT_FORMAT_OPTIONS } from './types.js';

/**
 * Format a time entry resource for output
 */
export function formatTimeEntry(
  entry: JsonApiResource,
  options: FormatOptions = {}
): FormattedTimeEntry {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = entry.attributes;
  const rels = entry.relationships;

  const timeMinutes = (attrs.time as number) || 0;
  const noteRaw = attrs.note as string | null | undefined;
  const note = opts.stripHtml ? stripHtml(noteRaw) || null : noteRaw || null;

  const result: FormattedTimeEntry = {
    id: entry.id,
    date: attrs.date as string,
    time_minutes: timeMinutes,
    time_hours: (timeMinutes / 60).toFixed(2),
    note,
  };

  // Include additional attributes if present
  if (attrs.billable_time !== undefined) {
    result.billable_time = attrs.billable_time as number;
  }
  if (attrs.approved !== undefined) {
    result.approved = attrs.approved as boolean;
  }

  // Include relationship IDs if requested
  if (opts.includeRelationshipIds) {
    result.person_id = rels?.person?.data?.id;
    result.service_id = rels?.service?.data?.id;
    result.project_id = rels?.project?.data?.id;
  }

  // Include timestamps if requested
  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at as string | undefined;
    result.updated_at = attrs.updated_at as string | undefined;
  }

  return result;
}


