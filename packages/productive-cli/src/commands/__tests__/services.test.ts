import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { servicesList } from '../services/handlers.js';
import { handleServicesCommand } from '../services/index.js';

describe('services command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('servicesList', () => {
    it('should list services in human format', async () => {
      const getServices = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'services',
            attributes: { name: 'Service 1', created_at: '2024-01-01', updated_at: '2024-01-02' },
          },
          {
            id: '2',
            type: 'services',
            attributes: { name: 'Service 2', created_at: '2024-01-03', updated_at: '2024-01-04' },
          },
        ],
        meta: { total: 2, page: 1, per_page: 100 },
      });

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
      });

      await servicesList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list services in json format', async () => {
      const getServices = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'services',
            attributes: { name: 'Service 1', created_at: '2024-01-01', updated_at: '2024-01-02' },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await servicesList(ctx);

      expect(getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
      });
    });

    it('should handle pagination options', async () => {
      const getServices = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
        options: { page: '2', size: '50', format: 'json' },
      });

      await servicesList(ctx);

      expect(getServices).toHaveBeenCalledWith({
        page: 2,
        perPage: 50,
        filter: {},
      });
    });

    it('should filter services with extended filters', async () => {
      const getServices = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
        options: {
          project: 'project-1',
          deal: 'deal-1',
          task: 'task-1',
          person: 'person-1',
          'budget-status': 'open',
          'billing-type': 'actuals',
          'time-tracking': true,
          format: 'json',
        },
      });

      await servicesList(ctx);

      expect(getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {
          project_id: 'project-1',
          deal_id: 'deal-1',
          task_id: 'task-1',
          person_id: 'person-1',
          budget_status: '1',
          billing_type: '2',
          time_tracking_enabled: 'true',
        },
      });
    });

    it('should filter services by budget-status delivered', async () => {
      const getServices = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
        options: { 'budget-status': 'delivered', format: 'json' },
      });

      await servicesList(ctx);

      expect(getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { budget_status: '2' },
      });
    });

    it('should filter services by billing-type fixed', async () => {
      const getServices = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
        options: { 'billing-type': 'fixed', format: 'json' },
      });

      await servicesList(ctx);

      expect(getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { billing_type: '1' },
      });
    });

    it('should filter services by billing-type none', async () => {
      const getServices = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
        options: { 'billing-type': 'none', format: 'json' },
      });

      await servicesList(ctx);

      expect(getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { billing_type: '3' },
      });
    });

    it('should handle API errors', async () => {
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getServices = vi.fn().mockRejectedValue(new ProductiveApiError('API Error', 500));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
      });

      await servicesList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unexpected errors', async () => {
      const getServices = vi.fn().mockRejectedValue(new Error('Unexpected error'));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getServices } as unknown as ProductiveApi,
      });

      await servicesList(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleServicesCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
