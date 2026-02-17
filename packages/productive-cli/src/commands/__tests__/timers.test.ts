import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { timersList, timersGet, timersStart, timersStop } from '../timers/handlers.js';
import { handleTimersCommand } from '../timers/index.js';

describe('timers command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('timersList', () => {
    it('should list timers', async () => {
      const getTimers = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'timers',
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
      });

      const ctx = createTestContext({
        api: { getTimers } as unknown as ProductiveApi,
      });

      await timersList(ctx);

      expect(getTimers).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        sort: '-started_at',
        include: ['time_entry'],
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should filter by person with --mine flag (uses config userId)', async () => {
      const getTimers = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getTimers } as unknown as ProductiveApi,
        options: { mine: true, format: 'json' },
      });

      await timersList(ctx);

      expect(getTimers).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { person_id: '500521' },
        }),
      );
    });

    it('should filter by person with --person flag', async () => {
      const getTimers = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getTimers } as unknown as ProductiveApi,
        options: { person: '456', format: 'json' },
      });

      await timersList(ctx);

      expect(getTimers).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { person_id: '456' },
        }),
      );
    });

    it('should filter by time-entry with --time-entry flag', async () => {
      const getTimers = vi.fn().mockResolvedValue({
        data: [],
        meta: { total: 0 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getTimers } as unknown as ProductiveApi,
        options: { 'time-entry': 'entry-123', format: 'json' },
      });

      await timersList(ctx);

      expect(getTimers).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { time_entry_id: 'entry-123' },
        }),
      );
    });
  });

  describe('timersGet', () => {
    it('should get a timer by id', async () => {
      const getTimer = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'timers',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: null,
            total_time: 60,
            person_id: '123',
          },
        },
        included: [],
      });

      const ctx = createTestContext({
        api: { getTimer } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await timersGet(['1'], ctx);

      expect(getTimer).toHaveBeenCalledWith('1', { include: ['time_entry'] });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await timersGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('timersStart', () => {
    it('should start a timer with service', async () => {
      const startTimer = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'timers',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: null,
            total_time: 0,
            person_id: '123',
          },
        },
      });

      const ctx = createTestContext({
        api: { startTimer } as unknown as ProductiveApi,
        options: { service: '789', format: 'json' },
      });

      await timersStart(ctx);

      expect(startTimer).toHaveBeenCalledWith({
        service_id: '789',
        time_entry_id: undefined,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should start a timer with time-entry', async () => {
      const startTimer = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'timers',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: null,
            total_time: 0,
            person_id: '123',
          },
        },
      });

      const ctx = createTestContext({
        api: { startTimer } as unknown as ProductiveApi,
        options: { 'time-entry': '456', format: 'json' },
      });

      await timersStart(ctx);

      expect(startTimer).toHaveBeenCalledWith({
        service_id: undefined,
        time_entry_id: '456',
      });
    });

    it('should exit with error when neither service nor time-entry is provided', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { format: 'json' },
      });

      await timersStart(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('timersStop', () => {
    it('should stop a timer', async () => {
      const stopTimer = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'timers',
          attributes: {
            started_at: '2024-01-15T09:00:00Z',
            stopped_at: '2024-01-15T10:00:00Z',
            total_time: 60,
            person_id: '123',
          },
        },
      });

      const ctx = createTestContext({
        api: { stopTimer } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await timersStop(['1'], ctx);

      expect(stopTimer).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await timersStop([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('format variants', () => {
    const mockTimer = {
      id: '1',
      type: 'timers',
      attributes: { started_at: '2024-01-15T10:00:00Z', stopped_at: null, total_time: 60 },
    };

    it('should list timers in csv format', async () => {
      const getTimers = vi.fn().mockResolvedValue({ data: [mockTimer], meta: { total: 1 } });
      const ctx = createTestContext({
        api: { getTimers } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });
      await timersList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list timers in human format', async () => {
      const getTimers = vi.fn().mockResolvedValue({ data: [mockTimer], meta: { total: 1 } });
      const ctx = createTestContext({
        api: { getTimers } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await timersList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a timer in human format', async () => {
      const getTimer = vi.fn().mockResolvedValue({ data: mockTimer, included: [] });
      const ctx = createTestContext({
        api: { getTimer } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await timersGet(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should start a timer in human format', async () => {
      const startTimer = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'timers', attributes: { started_at: '2024-01-15T10:00:00Z' } },
      });
      const ctx = createTestContext({
        api: { startTimer } as unknown as ProductiveApi,
        options: { service: '123', format: 'human' },
      });
      await timersStart(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should stop a timer in human format', async () => {
      const stopTimer = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'timers', attributes: { total_time: 120 } },
      });
      const ctx = createTestContext({
        api: { stopTimer } as unknown as ProductiveApi,
        options: { format: 'human' },
      });
      await timersStop(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleTimersCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
