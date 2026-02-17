import type { ProductiveBooking } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { ListBookingsOptions } from './types.js';

export function buildBookingFilters(options: ListBookingsOptions): Record<string, string> {
  const filter: Record<string, string> = {};

  if (options.additionalFilters) Object.assign(filter, options.additionalFilters);
  if (options.personId) filter.person_id = options.personId;
  if (options.projectId) filter.project_id = options.projectId;
  if (options.companyId) filter.company_id = options.companyId;
  if (options.serviceId) filter.service_id = options.serviceId;
  if (options.eventId) filter.event_id = options.eventId;
  if (options.after) filter.after = options.after;
  if (options.before) filter.before = options.before;

  if (options.draft !== undefined) {
    filter.draft = options.draft ? 'true' : 'false';
  }
  if (filter.draft === undefined) {
    filter.with_draft = 'true';
  }

  return filter;
}

export async function listBookings(
  options: ListBookingsOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProductiveBooking[]>> {
  const filter = buildBookingFilters(options);
  const { resolved: resolvedFilter, metadata } = await ctx.resolver.resolveFilters(filter);

  const response = await ctx.api.getBookings({
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    filter: resolvedFilter,
    sort: options.sort,
    include: options.include,
  });

  return {
    data: response.data,
    meta: response.meta,
    resolved: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}
