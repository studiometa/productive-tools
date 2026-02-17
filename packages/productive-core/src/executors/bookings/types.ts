import type { PaginationOptions } from '../types.js';

export interface ListBookingsOptions extends PaginationOptions {
  personId?: string;
  projectId?: string;
  companyId?: string;
  serviceId?: string;
  eventId?: string;
  after?: string;
  before?: string;
  /** Status: 'approved' | 'pending' | 'rejected' */
  status?: string;
  /** Booking method: 'hours_per_day' | 'total_hours' | 'percentage' */
  bookingMethod?: string;
  draft?: boolean;
  additionalFilters?: Record<string, string>;
}

export interface GetBookingOptions {
  id: string;
  include?: string[];
}

export interface CreateBookingOptions {
  personId: string;
  serviceId: string;
  startedOn: string;
  endedOn: string;
  time?: number;
  percentage?: number;
  bookingMethodId?: number;
  note?: string;
  eventId?: string;
}

export interface UpdateBookingOptions {
  id: string;
  startedOn?: string;
  endedOn?: string;
  time?: number;
  percentage?: number;
  note?: string;
}
