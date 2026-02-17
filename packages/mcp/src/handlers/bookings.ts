/**
 * Bookings MCP handler.
 */

import {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
} from '@studiometa/productive-core';

import type { BookingArgs } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatBooking } from '../formatters.js';
import { getBookingHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { inputErrorResult } from './utils.js';

export const handleBookings = createResourceHandler<BookingArgs>({
  resource: 'bookings',
  displayName: 'booking',
  actions: ['list', 'get', 'create', 'update'],
  formatter: formatBooking,
  hints: (data, id) => {
    const personId = data.relationships?.person?.data?.id;
    return getBookingHints(id, personId);
  },
  defaultInclude: {
    list: ['person', 'service'],
    get: ['person', 'service'],
  },
  create: {
    required: ['person_id', 'started_on', 'ended_on'],
    validateArgs: (args) => {
      if (!args.service_id && !args.event_id) {
        return inputErrorResult(ErrorMessages.missingBookingTarget());
      }
      return undefined;
    },
    mapOptions: (args) => ({
      personId: args.person_id,
      serviceId: args.service_id ?? '',
      startedOn: args.started_on,
      endedOn: args.ended_on,
      time: args.time,
      note: args.note,
      eventId: args.event_id,
    }),
  },
  update: {
    mapOptions: (args) => ({
      startedOn: args.started_on,
      endedOn: args.ended_on,
      time: args.time,
      note: args.note,
    }),
  },
  executors: {
    list: listBookings,
    get: getBooking,
    create: createBooking,
    update: updateBooking,
  },
});
