import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from './../api.js';

import { createTestContext } from './../context.js';
import { bookingsList, bookingsGet, bookingsAdd, bookingsUpdate } from './bookings/handlers.js';
import { handleBookingsCommand } from './bookings/index.js';

describe('bookings command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bookingsList', () => {
    it('should list bookings', async () => {
      const getBookings = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'bookings',
            attributes: {
              started_on: '2024-01-15',
              ended_on: '2024-01-19',
              time: 480,
              total_time: 2400,
              draft: false,
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
      });

      await bookingsList(ctx);

      expect(getBookings).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { with_draft: 'true' },
        sort: 'started_on',
        include: ['person', 'service'],
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should filter by person', async () => {
      const getBookings = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
        options: { person: '123', format: 'json' },
      });

      await bookingsList(ctx);

      expect(getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ person_id: '123' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      const getBookings = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
        options: { from: '2024-01-01', to: '2024-01-31', format: 'json' },
      });

      await bookingsList(ctx);

      expect(getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ after: '2024-01-01', before: '2024-01-31' }),
        }),
      );
    });

    it('should filter bookings with extended filters', async () => {
      const getBookings = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
        options: {
          project: 'project-1',
          company: 'company-1',
          service: 'service-1',
          event: 'event-1',
          type: 'absence',
          format: 'json',
        },
      });

      await bookingsList(ctx);

      expect(getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({
            project_id: 'project-1',
            company_id: 'company-1',
            service_id: 'service-1',
            event_id: 'event-1',
            booking_type: 'event',
          }),
        }),
      );
    });

    it('should filter bookings by type budget', async () => {
      const getBookings = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
        options: { type: 'budget', format: 'json' },
      });

      await bookingsList(ctx);

      expect(getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ booking_type: 'service' }),
        }),
      );
    });

    it('should filter tentative bookings only', async () => {
      const getBookings = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
        options: { tentative: true, format: 'json' },
      });

      await bookingsList(ctx);

      expect(getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ draft: 'true' }),
        }),
      );
    });

    it('should filter confirmed bookings only', async () => {
      const getBookings = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
        options: { tentative: false, format: 'json' },
      });

      await bookingsList(ctx);

      expect(getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ draft: 'false' }),
        }),
      );
    });
  });

  describe('bookingsGet', () => {
    it('should get a booking by id', async () => {
      const getBooking = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'bookings',
          attributes: {
            started_on: '2024-01-15',
            ended_on: '2024-01-19',
            time: 480,
            draft: false,
          },
        },
        included: [],
      });

      const ctx = createTestContext({
        api: { getBooking } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await bookingsGet(['1'], ctx);

      expect(getBooking).toHaveBeenCalledWith('1', {
        include: ['person', 'service', 'event', 'approver'],
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await bookingsGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('bookingsAdd', () => {
    it('should create a booking with service', async () => {
      const createBooking = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'bookings',
          attributes: {
            started_on: '2024-01-15',
            ended_on: '2024-01-19',
            draft: false,
          },
        },
      });

      const ctx = createTestContext({
        api: { createBooking } as unknown as ProductiveApi,
        options: {
          person: '123',
          from: '2024-01-15',
          to: '2024-01-19',
          service: '456',
          format: 'json',
        },
      });

      await bookingsAdd(ctx);

      expect(createBooking).toHaveBeenCalledWith({
        person_id: '123',
        service_id: '456',
        event_id: undefined,
        started_on: '2024-01-15',
        ended_on: '2024-01-19',
        time: undefined,
        total_time: undefined,
        percentage: undefined,
        draft: false,
        note: undefined,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when person is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        config: {
          apiToken: 'test-token',
          organizationId: '12345',
          userId: '',
          baseUrl: 'https://api.productive.io/api/v2',
        },
        options: { from: '2024-01-15', to: '2024-01-19', service: '456', format: 'json' },
      });

      await bookingsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when from date is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { person: '123', to: '2024-01-19', service: '456', format: 'json' },
      });

      await bookingsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when to date is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { person: '123', from: '2024-01-15', service: '456', format: 'json' },
      });

      await bookingsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when neither service nor event is provided', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { person: '123', from: '2024-01-15', to: '2024-01-19', format: 'json' },
      });

      await bookingsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('bookingsUpdate', () => {
    it('should update a booking', async () => {
      const updateBooking = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'bookings', attributes: {} },
      });

      const ctx = createTestContext({
        api: { updateBooking } as unknown as ProductiveApi,
        options: { from: '2024-01-20', format: 'json' },
      });

      await bookingsUpdate(['1'], ctx);

      expect(updateBooking).toHaveBeenCalledWith('1', { started_on: '2024-01-20' });
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { from: '2024-01-20', format: 'json' },
      });

      try {
        await bookingsUpdate([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { format: 'json' },
      });

      await bookingsUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('bookingsList formats', () => {
    const mockBooking = {
      id: '1',
      type: 'bookings',
      attributes: {
        started_on: '2024-01-15',
        ended_on: '2024-01-19',
        time: 480,
        total_time: 2400,
        draft: false,
      },
    };

    it('should list bookings in csv format', async () => {
      const getBookings = vi.fn().mockResolvedValue({
        data: [mockBooking],
        meta: { total: 1 },
        included: [],
      });
      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await bookingsList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list bookings in human format', async () => {
      const getBookings = vi.fn().mockResolvedValue({
        data: [mockBooking],
        meta: { total: 1 },
        included: [],
      });
      const ctx = createTestContext({
        api: { getBookings } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await bookingsList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('bookingsGet formats', () => {
    it('should get a booking in human format', async () => {
      const getBooking = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'bookings',
          attributes: { started_on: '2024-01-15', ended_on: '2024-01-19', time: 480, draft: false },
        },
        included: [],
      });
      const ctx = createTestContext({
        api: { getBooking } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await bookingsGet(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('bookingsAdd formats', () => {
    it('should create a booking in human format', async () => {
      const createBooking = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'bookings',
          attributes: { started_on: '2024-01-15', ended_on: '2024-01-19', draft: true },
        },
      });
      const ctx = createTestContext({
        api: { createBooking } as unknown as ProductiveApi,
        options: {
          person: '123',
          from: '2024-01-15',
          to: '2024-01-19',
          service: '456',
          tentative: true,
          format: 'human',
        },
      });

      await bookingsAdd(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('bookingsUpdate formats', () => {
    it('should update a booking in human format', async () => {
      const updateBooking = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'bookings', attributes: {} },
      });
      const ctx = createTestContext({
        api: { updateBooking } as unknown as ProductiveApi,
        options: { from: '2024-01-20', format: 'human' },
      });

      await bookingsUpdate(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle --confirm flag', async () => {
      const updateBooking = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'bookings', attributes: {} },
      });
      const ctx = createTestContext({
        api: { updateBooking } as unknown as ProductiveApi,
        options: { confirm: true, format: 'json' },
      });

      await bookingsUpdate(['1'], ctx);
      expect(updateBooking).toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleBookingsCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
