/**
 * Formatter for Timer resources
 */

import type { JsonApiResource, FormatOptions } from "./types.js";
import { DEFAULT_FORMAT_OPTIONS } from "./types.js";

export interface FormattedTimer {
  [key: string]: unknown;
  id: string;
  person_id: number;
  started_at: string;
  stopped_at: string | null;
  total_time: number;
  running: boolean;
  time_entry_id?: string;
}

/**
 * Format a Timer resource for output
 */
export function formatTimer(
  timer: JsonApiResource,
  options?: FormatOptions,
): FormattedTimer {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = timer.attributes;

  const result: FormattedTimer = {
    id: timer.id,
    person_id: Number(attrs.person_id),
    started_at: String(attrs.started_at || ""),
    stopped_at: attrs.stopped_at ? String(attrs.stopped_at) : null,
    total_time: Number(attrs.total_time || 0),
    running: !attrs.stopped_at,
  };

  if (opts.includeRelationshipIds) {
    const timeEntryId = timer.relationships?.time_entry?.data?.id;
    if (timeEntryId) {
      result.time_entry_id = timeEntryId;
    }
  }

  return result;
}
