import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from './../api.js';

import { createTestContext } from './../context.js';
import { budgetsList } from './budgets/handlers.js';
import { handleBudgetsCommand } from './budgets/index.js';

describe('budgets command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('budgetsList', () => {
    it('should list budgets in human format', async () => {
      const getBudgets = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'budgets',
            attributes: {
              total_time_budget: 100,
              remaining_time_budget: 50,
              total_monetary_budget: 10000,
              remaining_monetary_budget: 5000,
            },
          },
          {
            id: '2',
            type: 'budgets',
            attributes: {
              total_time_budget: 200,
              remaining_time_budget: 150,
              total_monetary_budget: null,
              remaining_monetary_budget: null,
            },
          },
        ],
        meta: { total: 2, page: 1, per_page: 100 },
      });

      const ctx = createTestContext({
        api: { getBudgets } as unknown as ProductiveApi,
      });

      await budgetsList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list budgets in json format', async () => {
      const getBudgets = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'budgets',
            attributes: {
              total_time_budget: 100,
              remaining_time_budget: 50,
              total_monetary_budget: 10000,
              remaining_monetary_budget: 5000,
            },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getBudgets } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await budgetsList(ctx);

      expect(getBudgets).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
      });
    });

    it('should filter budgets by project', async () => {
      const getBudgets = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getBudgets } as unknown as ProductiveApi,
        options: { project: '123', format: 'json' },
      });

      await budgetsList(ctx);

      expect(getBudgets).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { project_id: '123' },
      });
    });

    it('should handle pagination options', async () => {
      const getBudgets = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getBudgets } as unknown as ProductiveApi,
        options: { page: '3', size: '25', format: 'json' },
      });

      await budgetsList(ctx);

      expect(getBudgets).toHaveBeenCalledWith({
        page: 3,
        perPage: 25,
        filter: {},
      });
    });

    it('should handle budgets with only time budget', async () => {
      const getBudgets = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'budgets',
            attributes: {
              total_time_budget: 100,
              remaining_time_budget: 50,
              total_monetary_budget: null,
              remaining_monetary_budget: null,
            },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getBudgets } as unknown as ProductiveApi,
      });

      await budgetsList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getBudgets = vi.fn().mockRejectedValue(new ProductiveApiError('API Error', 500));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getBudgets } as unknown as ProductiveApi,
      });

      await budgetsList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unexpected errors', async () => {
      const getBudgets = vi.fn().mockRejectedValue(new Error('Unexpected error'));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getBudgets } as unknown as ProductiveApi,
      });

      await budgetsList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleBudgetsCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
