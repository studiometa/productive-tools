import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi, ProductiveApiError } from '../../api.js';
import { showReportsHelp } from '../reports/help.js';
import { handleReportsCommand } from '../reports/index.js';

// Mock dependencies
vi.mock('../../api.js', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  ProductiveApi: vi.fn(function () {}),
}));
vi.mock('../../output.js', () => ({
  OutputFormatter: vi.fn(function (format, noColor) {
    return {
      format,
      noColor,
      output: vi.fn(),
      error: vi.fn(),
    };
  }),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

describe('reports command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('time reports', () => {
    it('should fetch time reports in json format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'time_reports',
            attributes: { total_worked_time: 480, group: 'Person 1' },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({ group: 'person' }),
      );
    });

    it('should fetch time reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'time_reports',
            attributes: { total_worked_time: 480, group: 'Person 1' },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('time_reports', expect.anything());
    });

    it('should apply date filters', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], {
        from: '2024-01-01',
        to: '2024-01-31',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            after: '2024-01-01',
            before: '2024-01-31',
          }),
        }),
      );
    });

    it('should apply person and project filters', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], {
        person: '123',
        project: '456',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            person_id: '123',
            project_id: '456',
          }),
        }),
      );
    });

    it('should use custom group parameter', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], { group: 'project', format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({ group: 'project' }),
      );
    });
  });

  describe('project reports', () => {
    it('should fetch project reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'project_reports',
            attributes: {
              total_revenue_default: 10000,
              total_cost_default: 5000,
              average_profit_margin_default: 50,
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('project', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'project_reports',
        expect.objectContaining({ group: 'project', include: ['project'] }),
      );
    });

    it('should fetch project reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'project_reports',
            attributes: {
              total_revenue_default: 10000,
              total_cost_default: 5000,
              average_profit_margin_default: 50,
              group: 'Project A',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('project', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('project_reports', expect.anything());
    });

    it('should handle projects alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('projects', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('project_reports', expect.anything());
    });

    it('should filter by company', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('project', [], { company: '789', format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'project_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ company_id: '789' }),
        }),
      );
    });

    it('should parse generic filter for project reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('project', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'project_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });
  });

  describe('budget reports', () => {
    it('should fetch budget reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'budget_reports',
            attributes: { total_budget_time: 960, total_worked_time: 480 },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('budget', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'budget_reports',
        expect.objectContaining({ group: 'deal', include: ['deal'] }),
      );
    });

    it('should fetch budget reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'budget_reports',
            attributes: { total_budget_time: 960, total_worked_time: 480, group: 'Budget A' },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('budget', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('budget_reports', expect.anything());
    });

    it('should handle budgets alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('budgets', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('budget_reports', expect.anything());
    });

    it('should parse generic filter for budget reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('budget', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'budget_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });
  });

  describe('person reports', () => {
    it('should fetch person reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'person_reports',
            attributes: { total_worked_time: 480, total_billable_time: 400 },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('person', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'person_reports',
        expect.objectContaining({ group: 'person', include: ['person'] }),
      );
    });

    it('should fetch person reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'person_reports',
            attributes: { total_worked_time: 480, total_billable_time: 400, group: 'Person A' },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('person', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('person_reports', expect.anything());
    });

    it('should handle people alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('people', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('person_reports', expect.anything());
    });

    it('should parse generic filter for person reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('person', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'person_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });
  });

  describe('invoice reports', () => {
    it('should fetch invoice reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'invoice_reports',
            attributes: {
              total_amount: 10000,
              total_paid_amount: 5000,
              total_outstanding_amount: 5000,
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('invoice', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'invoice_reports',
        expect.objectContaining({ group: 'invoice', include: ['invoice'] }),
      );
    });

    it('should fetch invoice reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'invoice_reports',
            attributes: {
              total_amount: 10000,
              total_paid_amount: 5000,
              total_outstanding_amount: 5000,
              group: 'Invoice A',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('invoice', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('invoice_reports', expect.anything());
    });

    it('should parse generic filter for invoice reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('invoice', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'invoice_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });

    it('should handle invoices alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('invoices', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('invoice_reports', expect.anything());
    });

    it('should apply invoice-specific filters', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('invoice', [], {
        company: '123',
        status: 'overdue',
        from: '2024-01-01',
        to: '2024-01-31',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'invoice_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            company_id: '123',
            status: 'overdue',
            invoice_date_after: '2024-01-01',
            invoice_date_before: '2024-01-31',
          }),
        }),
      );
    });
  });

  describe('payment reports', () => {
    it('should fetch payment reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'payment_reports',
            attributes: { total_amount: 5000 },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('payment', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'payment_reports',
        expect.objectContaining({ group: 'payment', include: ['payment'] }),
      );
    });

    it('should fetch payment reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'payment_reports',
            attributes: { total_amount: 5000, group: 'Payment A' },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('payment', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('payment_reports', expect.anything());
    });

    it('should handle payments alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('payments', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('payment_reports', expect.anything());
    });

    it('should parse generic filter for payment reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('payment', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'payment_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });

    it('should apply date and company filters for payment reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('payment', [], {
        company: '123',
        from: '2024-01-01',
        to: '2024-12-31',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'payment_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            company_id: '123',
            date_after: '2024-01-01',
            date_before: '2024-12-31',
          }),
        }),
      );
    });
  });

  describe('service reports', () => {
    it('should fetch service reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'service_reports',
            attributes: { total_budget_time: 960, total_worked_time: 480, total_revenue: 10000 },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('service', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'service_reports',
        expect.objectContaining({ group: 'service', include: ['service'] }),
      );
    });

    it('should fetch service reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'service_reports',
            attributes: {
              total_budget_time: 960,
              total_worked_time: 480,
              total_revenue: 10000,
              group: 'Service A',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('service', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('service_reports', expect.anything());
    });

    it('should handle services alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('services', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('service_reports', expect.anything());
    });

    it('should filter by project and deal', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('service', [], {
        project: '123',
        deal: '456',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'service_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            project_id: '123',
            deal_id: '456',
          }),
        }),
      );
    });

    it('should parse generic filter for service reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('service', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'service_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });
  });

  describe('task reports', () => {
    it('should fetch task reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'task_reports',
            attributes: { total_tasks: 10, total_completed_tasks: 5, total_worked_time: 480 },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('task', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'task_reports',
        expect.objectContaining({ group: 'task', include: ['task'] }),
      );
    });

    it('should fetch task reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'task_reports',
            attributes: {
              total_tasks: 10,
              total_completed_tasks: 5,
              total_worked_time: 480,
              group: 'Task A',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('task', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('task_reports', expect.anything());
    });

    it('should handle tasks alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('tasks', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('task_reports', expect.anything());
    });

    it('should filter by project and person (assignee)', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('task', [], {
        project: '123',
        person: '456',
        status: 'open',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'task_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            project_id: '123',
            assignee_id: '456',
            status: 'open',
          }),
        }),
      );
    });

    it('should parse generic filter for task reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('task', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'task_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });
  });

  describe('company reports', () => {
    it('should fetch company reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'company_reports',
            attributes: { total_revenue: 50000, total_cost: 25000, average_profit_margin: 50 },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('company', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'company_reports',
        expect.objectContaining({ group: 'company', include: ['company'] }),
      );
    });

    it('should fetch company reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'company_reports',
            attributes: {
              total_revenue: 50000,
              total_cost: 25000,
              average_profit_margin: 50,
              group: 'Company A',
            },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('company', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('company_reports', expect.anything());
    });

    it('should handle companies alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('companies', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('company_reports', expect.anything());
    });

    it('should parse generic filter for company reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('company', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'company_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });

    it('should apply date filters for company reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('company', [], {
        from: '2024-01-01',
        to: '2024-12-31',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'company_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            after: '2024-01-01',
            before: '2024-12-31',
          }),
        }),
      );
    });
  });

  describe('deal reports', () => {
    it('should fetch deal reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'deal_reports',
            attributes: { total_value: 100000, total_won_value: 50000 },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('deal', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'deal_reports',
        expect.objectContaining({ group: 'deal', include: ['deal'] }),
      );
    });

    it('should fetch deal reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'deal_reports',
            attributes: { total_value: 100000, total_won_value: 50000, group: 'Deal A' },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('deal', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('deal_reports', expect.anything());
    });

    it('should apply date filters for deal reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('deal', [], {
        from: '2024-01-01',
        to: '2024-12-31',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'deal_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            date_after: '2024-01-01',
            date_before: '2024-12-31',
          }),
        }),
      );
    });

    it('should parse generic filter for deal reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('deal', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'deal_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });

    it('should handle deals alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('deals', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('deal_reports', expect.anything());
    });

    it('should filter by company and status', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('deal', [], {
        company: '123',
        status: '456',
        from: '2024-01-01',
        to: '2024-12-31',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'deal_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            company_id: '123',
            deal_status_id: '456',
            date_after: '2024-01-01',
            date_before: '2024-12-31',
          }),
        }),
      );
    });
  });

  describe('timesheet reports', () => {
    it('should fetch timesheet reports', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'timesheet_reports',
            attributes: { status: 'approved', total_time: 2400 },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('timesheet', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'timesheet_reports',
        expect.objectContaining({ include: ['person'] }),
      );
    });

    it('should fetch timesheet reports in human format', async () => {
      const mockReports = {
        data: [
          {
            id: 'report-1',
            type: 'timesheet_reports',
            attributes: { status: 'approved', total_time: 2400, group: 'Person A' },
          },
        ],
        meta: { total: 1 },
      };

      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('timesheet', [], { format: 'human' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(mockApi.getReports).toHaveBeenCalledWith('timesheet_reports', expect.anything());
    });

    it('should apply date filters for timesheet reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('timesheet', [], {
        from: '2024-01-01',
        to: '2024-01-31',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'timesheet_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            after: '2024-01-01',
            before: '2024-01-31',
          }),
        }),
      );
    });

    it('should parse generic filter for timesheet reports', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('timesheet', [], {
        filter: 'custom_key=custom_value',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'timesheet_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            custom_key: 'custom_value',
          }),
        }),
      );
    });

    it('should handle timesheets alias', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('timesheets', [], { format: 'json' });

      expect(mockApi.getReports).toHaveBeenCalledWith('timesheet_reports', expect.anything());
    });

    it('should filter by person and status', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('timesheet', [], {
        person: '123',
        status: 'pending',
        from: '2024-01-01',
        to: '2024-01-31',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'timesheet_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            person_id: '123',
            status: 'pending',
            after: '2024-01-01',
            before: '2024-01-31',
          }),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const mockError = new ProductiveApiError('API Error', 500);
      const mockApi = {
        getReports: vi.fn().mockRejectedValue(mockError),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unexpected errors', async () => {
      const mockApi = {
        getReports: vi.fn().mockRejectedValue(new Error('Unexpected error')),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleReportsCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('pagination', () => {
    it('should handle pagination options', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], {
        page: '2',
        size: '50',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({
          page: 2,
          perPage: 50,
        }),
      );
    });
  });

  describe('generic filters', () => {
    it('should parse filter string into key-value pairs', async () => {
      const mockReports = { data: [], meta: {} };
      const mockApi = {
        getReports: vi.fn().mockResolvedValue(mockReports),
      };
      vi.mocked(ProductiveApi).mockImplementation(function () {
        return mockApi as any;
      });

      await handleReportsCommand('time', [], {
        filter: 'key1=value1,key2=value2',
        format: 'json',
      });

      expect(mockApi.getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({
          filter: expect.objectContaining({
            key1: 'value1',
            key2: 'value2',
          }),
        }),
      );
    });
  });
});

describe('reports help', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should show main help without subcommand', () => {
    showReportsHelp();
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports');
    expect(output).toContain('REPORT TYPES');
  });

  it('should show time report help', () => {
    showReportsHelp('time');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports time');
    expect(output).toContain('--from');
  });

  it('should show project report help', () => {
    showReportsHelp('project');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports project');
  });

  it('should show budget report help', () => {
    showReportsHelp('budget');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports budget');
  });

  it('should show person report help', () => {
    showReportsHelp('person');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports person');
  });

  it('should show invoice report help', () => {
    showReportsHelp('invoice');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports invoice');
    expect(output).toContain('--status');
  });

  it('should show payment report help', () => {
    showReportsHelp('payment');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports payment');
  });

  it('should show service report help', () => {
    showReportsHelp('service');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports service');
  });

  it('should show task report help', () => {
    showReportsHelp('task');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports task');
  });

  it('should show company report help', () => {
    showReportsHelp('company');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports company');
  });

  it('should show deal report help', () => {
    showReportsHelp('deal');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports deal');
  });

  it('should show timesheet report help', () => {
    showReportsHelp('timesheet');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports timesheet');
  });

  it('should resolve aliases to canonical names', () => {
    showReportsHelp('projects');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('productive reports project');
  });

  it('should show main help for unknown subcommand', () => {
    showReportsHelp('unknown');
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('REPORT TYPES');
  });
});
