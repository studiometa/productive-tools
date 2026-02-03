import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi, ProductiveApiError } from '../../api.js';
import { handleServicesCommand } from '../services/index.js';

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

describe('services command', () => {
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
    it('should list services in human format', async () => {
      const mockServices = {
        data: [
          {
            id: '1',
            attributes: {
              name: 'Service 1',
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
          {
            id: '2',
            attributes: {
              name: 'Service 2',
              created_at: '2024-01-03',
              updated_at: '2024-01-04',
            },
          },
        ],
        meta: { total: 2, page: 1, per_page: 100 },
      };

      vi.mocked(ProductiveApi).mockImplementation(
        () =>
          ({
            getServices: vi.fn().mockResolvedValue(mockServices),
          }) as any,
      );

      await handleServicesCommand('list', [], {});

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should list services in json format', async () => {
      const mockServices = {
        data: [
          {
            id: '1',
            attributes: {
              name: 'Service 1',
              created_at: '2024-01-01',
              updated_at: '2024-01-02',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getServices: vi.fn().mockResolvedValue(mockServices),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('list', [], { format: 'json' });

      expect(mockApi.getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
      });
    });

    it('should handle pagination options', async () => {
      const mockServices = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getServices: vi.fn().mockResolvedValue(mockServices),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('list', [], {
        page: '2',
        size: '50',
      });

      expect(mockApi.getServices).toHaveBeenCalledWith({
        page: 2,
        perPage: 50,
        filter: {},
      });
    });

    it('should filter services with extended filters', async () => {
      const mockServices = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getServices: vi.fn().mockResolvedValue(mockServices),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('list', [], {
        project: 'project-1',
        deal: 'deal-1',
        task: 'task-1',
        person: 'person-1',
        'budget-status': 'open',
        'billing-type': 'actuals',
        'time-tracking': true,
      });

      expect(mockApi.getServices).toHaveBeenCalledWith({
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
      const mockServices = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getServices: vi.fn().mockResolvedValue(mockServices),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('list', [], { 'budget-status': 'delivered' });

      expect(mockApi.getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { budget_status: '2' },
      });
    });

    it('should filter services by billing-type fixed', async () => {
      const mockServices = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getServices: vi.fn().mockResolvedValue(mockServices),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('list', [], { 'billing-type': 'fixed' });

      expect(mockApi.getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { billing_type: '1' },
      });
    });

    it('should filter services by billing-type none', async () => {
      const mockServices = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getServices: vi.fn().mockResolvedValue(mockServices),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('list', [], { 'billing-type': 'none' });

      expect(mockApi.getServices).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: { billing_type: '3' },
      });
    });

    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('API Error', 500);
      const mockApi = {
        getServices: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('list', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unexpected errors', async () => {
      const mockApi = {
        getServices: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('list', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('ls alias', () => {
    it('should work as an alias for list', async () => {
      const mockServices = {
        data: [],
        meta: { total: 0 },
      };

      const mockApi = {
        getServices: vi.fn().mockResolvedValue(mockServices),
      };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleServicesCommand('ls', [], {});

      expect(mockApi.getServices).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleServicesCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
