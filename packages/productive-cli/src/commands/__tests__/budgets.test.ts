import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleBudgetsCommand } from '../budgets/index.js';
import { ProductiveApi, ProductiveApiError } from '../../api.js';

// Mock dependencies
vi.mock('../../api.js');
vi.mock('../../output.js', () => ({
  OutputFormatter: vi.fn().mockImplementation((format, noColor) => ({
    format,
    noColor,
    output: vi.fn(),
    error: vi.fn(),
  })),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

describe('budgets command', () => {
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
    it('should list budgets in human format', async () => {
      const mockBudgets = {
        data: [
          {
            id: '1',
            attributes: {
              total_time_budget: 100,
              remaining_time_budget: 50,
              total_monetary_budget: 10000,
              remaining_monetary_budget: 5000,
            },
          },
          {
            id: '2',
            attributes: {
              total_time_budget: 200,
              remaining_time_budget: 150,
              total_monetary_budget: null,
              remaining_monetary_budget: null,
            },
          },
        ],
        meta: { total: 2, page: 1, per_page: 100 },
      };

      vi.mocked(ProductiveApi).mockImplementation(
        () =>
          ({
            getBudgets: vi.fn().mockResolvedValue(mockBudgets),
          }) as any
      );

      await handleBudgetsCommand('list', [], {});

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should list budgets in json format', async () => {
      const mockBudgets = {
        data: [
          {
            id: '1',
            attributes: {
              total_time_budget: 100,
              remaining_time_budget: 50,
              total_monetary_budget: 10000,
              remaining_monetary_budget: 5000,
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getBudgets: vi.fn().mockResolvedValue(mockBudgets),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBudgetsCommand('list', [], { format: 'json' });

      expect(mockApi.getBudgets).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
      });
    });

    it('should filter budgets by project', async () => {
      const mockBudgets = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getBudgets: vi.fn().mockResolvedValue(mockBudgets),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBudgetsCommand('list', [], {
        project: '123',
      });

      expect(mockApi.getBudgets).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { project_id: '123' },
      });
    });

    it('should handle pagination options', async () => {
      const mockBudgets = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getBudgets: vi.fn().mockResolvedValue(mockBudgets),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBudgetsCommand('list', [], {
        page: '3',
        size: '25',
      });

      expect(mockApi.getBudgets).toHaveBeenCalledWith({
        page: 3,
        perPage: 25,
        filter: {},
      });
    });

    it('should handle budgets with only time budget', async () => {
      const mockBudgets = {
        data: [
          {
            id: '1',
            attributes: {
              total_time_budget: 100,
              remaining_time_budget: 50,
              total_monetary_budget: null,
              remaining_monetary_budget: null,
            },
          },
        ],
        meta: { total: 1 },
      };

      vi.mocked(ProductiveApi).mockImplementation(
        () =>
          ({
            getBudgets: vi.fn().mockResolvedValue(mockBudgets),
          }) as any
      );

      await handleBudgetsCommand('list', [], {});

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('API Error', 500);
      const mockApi = {
        getBudgets: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBudgetsCommand('list', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unexpected errors', async () => {
      const mockApi = {
        getBudgets: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBudgetsCommand('list', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('ls alias', () => {
    it('should work as an alias for list', async () => {
      const mockBudgets = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getBudgets: vi.fn().mockResolvedValue(mockBudgets),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleBudgetsCommand('ls', [], {});

      expect(mockApi.getBudgets).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleBudgetsCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
