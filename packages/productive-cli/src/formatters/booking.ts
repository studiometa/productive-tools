/**
 * Formatter for Booking resources
 */

import type { JsonApiResource, FormatOptions } from "./types.js";
import { DEFAULT_FORMAT_OPTIONS } from "./types.js";

export interface FormattedBooking {
  [key: string]: unknown;
  id: string;
  started_on: string;
  ended_on: string;
  time: number | null;
  total_time: number | null;
  percentage: number | null;
  booking_method: string;
  draft: boolean;
  note: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  person_id?: string;
  person_name?: string;
  service_id?: string;
  service_name?: string;
  event_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get booking method name from ID
 */
function getBookingMethodName(id: number): string {
  switch (id) {
    case 1:
      return "per_day";
    case 2:
      return "percentage";
    case 3:
      return "total_hours";
    default:
      return "unknown";
  }
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
 * Format a Booking resource for output
 */
export function formatBooking(
  booking: JsonApiResource,
  options?: FormatOptions,
): FormattedBooking {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = booking.attributes;

  // Get related resources from includes
  const personId = booking.relationships?.person?.data?.id;
  const personData = getIncludedResource(opts.included, "people", personId);

  const serviceId = booking.relationships?.service?.data?.id;
  const serviceData = getIncludedResource(opts.included, "services", serviceId);

  const eventId = booking.relationships?.event?.data?.id;

  const result: FormattedBooking = {
    id: booking.id,
    started_on: String(attrs.started_on || ""),
    ended_on: String(attrs.ended_on || ""),
    time: attrs.time != null ? Number(attrs.time) : null,
    total_time: attrs.total_time != null ? Number(attrs.total_time) : null,
    percentage: attrs.percentage != null ? Number(attrs.percentage) : null,
    booking_method: getBookingMethodName(Number(attrs.booking_method_id || 1)),
    draft: Boolean(attrs.draft),
    note: attrs.note ? String(attrs.note) : null,
    approved_at: attrs.approved_at ? String(attrs.approved_at) : null,
    rejected_at: attrs.rejected_at ? String(attrs.rejected_at) : null,
    rejected_reason: attrs.rejected_reason ? String(attrs.rejected_reason) : null,
  };

  if (opts.includeRelationshipIds) {
    if (personId) result.person_id = personId;
    if (serviceId) result.service_id = serviceId;
    if (eventId) result.event_id = eventId;
  }

  if (personData) {
    result.person_name = `${personData.first_name} ${personData.last_name}`;
  }

  if (serviceData) {
    result.service_name = String(serviceData.name || "");
  }

  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at ? String(attrs.created_at) : undefined;
    result.updated_at = attrs.updated_at ? String(attrs.updated_at) : undefined;
  }

  return result;
}
