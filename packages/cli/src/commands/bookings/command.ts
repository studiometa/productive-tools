/**
 * Bookings command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { bookingsList, bookingsGet, bookingsAdd, bookingsUpdate } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const bookingsCommandConfig: CommandRouterConfig = {
  resource: 'bookings',
  handlers: {
    list: bookingsList,
    ls: bookingsList,
    get: [bookingsGet, 'args'],
    add: bookingsAdd,
    create: bookingsAdd,
    update: [bookingsUpdate, 'args'],
  },
};

/**
 * Handle bookings command
 */
export const handleBookingsCommand = createCommandRouter(bookingsCommandConfig);
