import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi } from '../../api.js';
import { handleTimersCommand } from '../timers/index.js';

// Mock dependencies
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

describe('timers command', () => {
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
    it('should list timers', async () => {
      const mockTimers = {
        data: [
          {
            id: '1',
            attributes: {
              started_at: '2024-01-15T09:00:00Z',
              stopped_at: null,
              total_time: 60,
              person_id: '123',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
        included: [],
      };

      const mockApi = {
        getTimers: vi.fn().mockResolvedValue(mockTimers),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTimersCommand('list', [], {});

      expect(mockApi.getTimers).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '-started_at',
        include: ['time_entry'],
      });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should not filter by person if --mine is used without userId config', async () => {
      const mockTimers = {
        data: [],
        meta: { total: 0, page: 1, per_page: 100 },
        included: [],
      };

      const mockApi = {
        getTimers: vi.fn().mockResolvedValue(mockTimers),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      // Without userId in config, --mine won't filter
      await handleTimersCommand('list', [], { mine: true });

      expect(mockApi.getTimers).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {},
        }),
      );
    });

    it('should filter by person with --person flag', async () => {
      const mockTimers = {
        data: [],
        meta: { total: 0, page: 1, per_page: 100 },
        included: [],
      };

      const mockApi = {
        getTimers: vi.fn().mockResolvedValue(mockTimers),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTimersCommand('list', [], { person: '456' });

      expect(mockApi.getTimers).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { person_id: '456' },
        }),
      );
    });
  });

  describe('get command', () => {
    it('should get a timer by id', async () => {
      const mockTimer = {
        data: {
          id: '1',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: null,
            total_time: 60,
            person_id: '123',
          },
        },
        included: [],
      };

      const mockApi = {
        getTimer: vi.fn().mockResolvedValue(mockTimer),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTimersCommand('get', ['1'], {});

      expect(mockApi.getTimer).toHaveBeenCalledWith('1', {
        include: ['time_entry'],
      });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleTimersCommand('get', [], {});
      } catch {
        // exitWithValidationError throws after process.exit (which is mocked)
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('start command', () => {
    it('should start a timer with service', async () => {
      const mockTimer = {
        data: {
          id: '1',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: null,
            total_time: 0,
            person_id: '123',
          },
        },
      };

      const mockApi = {
        startTimer: vi.fn().mockResolvedValue(mockTimer),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTimersCommand('start', [], { service: '789' });

      expect(mockApi.startTimer).toHaveBeenCalledWith({
        service_id: '789',
        time_entry_id: undefined,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should start a timer with time-entry', async () => {
      const mockTimer = {
        data: {
          id: '1',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: null,
            total_time: 0,
            person_id: '123',
          },
        },
      };

      const mockApi = {
        startTimer: vi.fn().mockResolvedValue(mockTimer),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTimersCommand('start', [], { 'time-entry': '456' });

      expect(mockApi.startTimer).toHaveBeenCalledWith({
        service_id: undefined,
        time_entry_id: '456',
      });
    });

    it('should exit with error when neither service nor time-entry is provided', async () => {
      await handleTimersCommand('start', [], {});

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should output JSON format when requested', async () => {
      const mockTimer = {
        data: {
          id: '1',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: null,
            total_time: 0,
            person_id: '123',
          },
        },
      };

      const mockApi = {
        startTimer: vi.fn().mockResolvedValue(mockTimer),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTimersCommand('start', [], { service: '789', format: 'json' });

      expect(mockApi.startTimer).toHaveBeenCalled();
    });
  });

  describe('stop command', () => {
    it('should stop a timer', async () => {
      const mockTimer = {
        data: {
          id: '1',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: '2024-01-15T10:00:00Z',
            total_time: 60,
            person_id: '123',
          },
        },
      };

      const mockApi = {
        stopTimer: vi.fn().mockResolvedValue(mockTimer),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTimersCommand('stop', ['1'], {});

      expect(mockApi.stopTimer).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleTimersCommand('stop', [], {});
      } catch {
        // exitWithValidationError throws after process.exit (which is mocked)
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should output JSON format when requested', async () => {
      const mockTimer = {
        data: {
          id: '1',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: '2024-01-15T10:00:00Z',
            total_time: 60,
            person_id: '123',
          },
        },
      };

      const mockApi = {
        stopTimer: vi.fn().mockResolvedValue(mockTimer),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleTimersCommand('stop', ['1'], { format: 'json' });

      expect(mockApi.stopTimer).toHaveBeenCalledWith('1');
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleTimersCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
