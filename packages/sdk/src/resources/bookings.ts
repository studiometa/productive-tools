import type { ProductiveBooking, ProductiveApiMeta } from '@studiometa/productive-api';

import type { Booking } from '../types.js';

import { resolveListResponse, resolveSingleResponse } from '../json-api.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { BaseCollection } from './base.js';

export interface BookingListOptions {
  page?: number;
  perPage?: number;
  filter?: Record<string, string>;
  sort?: string;
  include?: string[];
}

export interface BookingGetOptions {
  include?: string[];
}

export interface BookingCreateData {
  person_id: string;
  started_on: string;
  ended_on: string;
  service_id?: string;
  event_id?: string;
  time?: number;
  total_time?: number;
  percentage?: number;
  booking_method_id?: number;
  draft?: boolean;
  note?: string;
}

export interface BookingUpdateData {
  started_on?: string;
  ended_on?: string;
  time?: number;
  total_time?: number;
  percentage?: number;
  draft?: boolean;
  note?: string;
}

export interface BookingListResult {
  data: Booking[];
  meta: ProductiveApiMeta | undefined;
}

export interface BookingGetResult {
  data: Booking;
  meta: ProductiveApiMeta | undefined;
}

export class BookingsCollection extends BaseCollection {
  /**
   * List bookings with optional filtering, pagination, and includes.
   */
  async list(options: BookingListOptions = {}): Promise<BookingListResult> {
    const response = await this.wrapRequest(() => this.api.getBookings(options));
    return resolveListResponse<ProductiveBooking, Booking>(response);
  }

  /**
   * Get a single booking by ID, with optional includes.
   */
  async get(id: string, options: BookingGetOptions = {}): Promise<BookingGetResult> {
    const response = await this.wrapRequest(() => this.api.getBooking(id, options));
    return resolveSingleResponse<ProductiveBooking, Booking>(response);
  }

  /**
   * Create a new booking.
   */
  async create(data: BookingCreateData): Promise<BookingGetResult> {
    const response = await this.wrapRequest(() => this.api.createBooking(data));
    return resolveSingleResponse<ProductiveBooking, Booking>(response);
  }

  /**
   * Update an existing booking.
   */
  async update(id: string, data: BookingUpdateData): Promise<BookingGetResult> {
    const response = await this.wrapRequest(() => this.api.updateBooking(id, data));
    return resolveSingleResponse<ProductiveBooking, Booking>(response);
  }

  /**
   * Start a fluent query builder for bookings, optionally with initial filters.
   */
  where(filters: Record<string, string> = {}): QueryBuilder<Booking, BookingListResult> {
    return new QueryBuilder<Booking, BookingListResult>(this).filter(filters);
  }

  /**
   * Iterate over all bookings across all pages.
   */
  all(options: Omit<BookingListOptions, 'page'> = {}): AsyncPaginatedIterator<Booking> {
    const perPage = options.perPage ?? 200;
    return new AsyncPaginatedIterator<Booking>(async (page) => {
      return this.list({ ...options, page, perPage });
    }, perPage);
  }
}
