import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi } from '../../api.js';
import { handleBookingsCommand } from '../bookings/index.js';

vi.mock('../../api.js', () => ({
  ProductiveApi: vi.fn(),
  ProductiveApiError: class ProductiveApiError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public response?: unknown,
    ) {
      super(message);
      this.name = 'ProductiveApiError';
    }
  },
}));

vi.mock('../../output.js', () => ({
  OutputFormatter: vi.fn().mockImplementation((format, noColor) => ({
    format,
    noColor,
    output: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  })),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

describe('bookings command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('list command', () => {
    it('should list bookings', async () => {
      const mockBookings = {
        data: [
          {
            id: '1',
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
      };

      const mockApi = {
        getBookings: vi.fn().mockResolvedValue(mockBookings),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBookingsCommand('list', [], {});

      expect(mockApi.getBookings).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { with_draft: 'true' },
        sort: 'started_on',
        include: ['person', 'service'],
      });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should filter by person', async () => {
      const mockBookings = { data: [], meta: {}, included: [] };
      const mockApi = { getBookings: vi.fn().mockResolvedValue(mockBookings) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBookingsCommand('list', [], { person: '123' });

      expect(mockApi.getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ person_id: '123' }),
        }),
      );
    });

    it('should filter by date range', async () => {
      const mockBookings = { data: [], meta: {}, included: [] };
      const mockApi = { getBookings: vi.fn().mockResolvedValue(mockBookings) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBookingsCommand('list', [], { from: '2024-01-01', to: '2024-01-31' });

      expect(mockApi.getBookings).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ after: '2024-01-01', before: '2024-01-31' }),
        }),
      );
    });
  });

  describe('get command', () => {
    it('should get a booking by id', async () => {
      const mockBooking = {
        data: {
          id: '1',
          attributes: {
            started_on: '2024-01-15',
            ended_on: '2024-01-19',
            time: 480,
            draft: false,
          },
        },
        included: [],
      };

      const mockApi = { getBooking: vi.fn().mockResolvedValue(mockBooking) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBookingsCommand('get', ['1'], {});

      expect(mockApi.getBooking).toHaveBeenCalledWith('1', {
        include: ['person', 'service', 'event', 'approver'],
      });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleBookingsCommand('get', [], {});
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('add command', () => {
    it('should create a booking with service', async () => {
      const mockBooking = {
        data: {
          id: '1',
          attributes: {
            started_on: '2024-01-15',
            ended_on: '2024-01-19',
            draft: false,
          },
        },
      };

      const mockApi = { createBooking: vi.fn().mockResolvedValue(mockBooking) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBookingsCommand('add', [], {
        person: '123',
        from: '2024-01-15',
        to: '2024-01-19',
        service: '456',
      });

      expect(mockApi.createBooking).toHaveBeenCalledWith({
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
      await handleBookingsCommand('add', [], {
        from: '2024-01-15',
        to: '2024-01-19',
        service: '456',
      });

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when from date is missing', async () => {
      await handleBookingsCommand('add', [], { person: '123', to: '2024-01-19', service: '456' });

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when to date is missing', async () => {
      await handleBookingsCommand('add', [], { person: '123', from: '2024-01-15', service: '456' });

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when neither service nor event is provided', async () => {
      await handleBookingsCommand('add', [], {
        person: '123',
        from: '2024-01-15',
        to: '2024-01-19',
      });

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('update command', () => {
    it('should update a booking', async () => {
      const mockBooking = { data: { id: '1', attributes: {} } };
      const mockApi = { updateBooking: vi.fn().mockResolvedValue(mockBooking) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBookingsCommand('update', ['1'], { from: '2024-01-20' });

      expect(mockApi.updateBooking).toHaveBeenCalledWith('1', { started_on: '2024-01-20' });
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleBookingsCommand('update', [], { from: '2024-01-20' });
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      await handleBookingsCommand('update', ['1'], {});

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleBookingsCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
