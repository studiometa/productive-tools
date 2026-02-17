import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from './../api.js';

import { createTestContext } from './../context.js';
import {
  reportsTime,
  reportsProject,
  reportsBudget,
  reportsPerson,
  reportsInvoice,
  reportsPayment,
  reportsService,
  reportsTask,
  reportsCompany,
  reportsDeal,
  reportsTimesheet,
} from './reports/handlers.js';
import { showReportsHelp } from './reports/help.js';
import { handleReportsCommand } from './reports/index.js';

/**
 * Helper to create a test context with a mocked getReports method.
 */
function createReportCtx(
  mockData: unknown[] = [],
  options: Record<string, string | boolean | number | undefined> = {},
) {
  const getReports = vi
    .fn()
    .mockResolvedValue({ data: mockData, meta: { total: mockData.length } });
  const ctx = createTestContext({
    api: { getReports } as unknown as ProductiveApi,
    options: { format: 'json', ...options },
  });
  return { ctx, getReports };
}

describe('reports command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('time reports', () => {
    it('should fetch time reports in json format', async () => {
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'time_reports',
          attributes: { total_worked_time: 480, group: 'Person 1' },
        },
      ]);

      await reportsTime(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({ group: 'person' }),
      );
    });

    it('should fetch time reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
          {
            id: 'report-1',
            type: 'time_reports',
            attributes: { total_worked_time: 480, group: 'Person 1' },
          },
        ],
        { format: 'human' },
      );

      await reportsTime(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('time_reports', expect.anything());
    });

    it('should apply date filters', async () => {
      const { ctx, getReports } = createReportCtx([], { from: '2024-01-01', to: '2024-01-31' });

      await reportsTime(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ after: '2024-01-01', before: '2024-01-31' }),
        }),
      );
    });

    it('should apply person and project filters', async () => {
      const { ctx, getReports } = createReportCtx([], { person: '123', project: '456' });

      await reportsTime(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ person_id: '123', project_id: '456' }),
        }),
      );
    });

    it('should use custom group parameter', async () => {
      const { ctx, getReports } = createReportCtx([], { group: 'project' });

      await reportsTime(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({ group: 'project' }),
      );
    });
  });

  describe('project reports', () => {
    it('should fetch project reports', async () => {
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'project_reports',
          attributes: {
            total_revenue_default: 10000,
            total_cost_default: 5000,
            average_profit_margin_default: 50,
          },
        },
      ]);

      await reportsProject(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'project_reports',
        expect.objectContaining({ group: 'project', include: ['project'] }),
      );
    });

    it('should fetch project reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
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
        { format: 'human' },
      );

      await reportsProject(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('project_reports', expect.anything());
    });

    it('should filter by company', async () => {
      const { ctx, getReports } = createReportCtx([], { company: '789' });

      await reportsProject(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'project_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ company_id: '789' }),
        }),
      );
    });

    it('should parse generic filter for project reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsProject(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'project_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });
  });

  describe('budget reports', () => {
    it('should fetch budget reports', async () => {
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'budget_reports',
          attributes: { total_budget_time: 960, total_worked_time: 480 },
        },
      ]);

      await reportsBudget(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'budget_reports',
        expect.objectContaining({ group: 'deal', include: ['deal'] }),
      );
    });

    it('should fetch budget reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
          {
            id: 'report-1',
            type: 'budget_reports',
            attributes: { total_budget_time: 960, total_worked_time: 480, group: 'Budget A' },
          },
        ],
        { format: 'human' },
      );

      await reportsBudget(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('budget_reports', expect.anything());
    });

    it('should parse generic filter for budget reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsBudget(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'budget_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });
  });

  describe('person reports', () => {
    it('should fetch person reports', async () => {
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'person_reports',
          attributes: { total_worked_time: 480, total_billable_time: 400 },
        },
      ]);

      await reportsPerson(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'person_reports',
        expect.objectContaining({ group: 'person', include: ['person'] }),
      );
    });

    it('should fetch person reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
          {
            id: 'report-1',
            type: 'person_reports',
            attributes: { total_worked_time: 480, total_billable_time: 400, group: 'Person A' },
          },
        ],
        { format: 'human' },
      );

      await reportsPerson(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('person_reports', expect.anything());
    });

    it('should parse generic filter for person reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsPerson(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'person_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });
  });

  describe('invoice reports', () => {
    it('should fetch invoice reports', async () => {
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'invoice_reports',
          attributes: {
            total_amount: 10000,
            total_paid_amount: 5000,
            total_outstanding_amount: 5000,
          },
        },
      ]);

      await reportsInvoice(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'invoice_reports',
        expect.objectContaining({ group: 'invoice', include: ['invoice'] }),
      );
    });

    it('should fetch invoice reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
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
        { format: 'human' },
      );

      await reportsInvoice(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('invoice_reports', expect.anything());
    });

    it('should parse generic filter for invoice reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsInvoice(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'invoice_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });

    it('should apply invoice-specific filters', async () => {
      const { ctx, getReports } = createReportCtx([], {
        company: '123',
        status: 'overdue',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      await reportsInvoice(ctx);

      expect(getReports).toHaveBeenCalledWith(
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
      const { ctx, getReports } = createReportCtx([
        { id: 'report-1', type: 'payment_reports', attributes: { total_amount: 5000 } },
      ]);

      await reportsPayment(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'payment_reports',
        expect.objectContaining({ group: 'payment', include: ['payment'] }),
      );
    });

    it('should fetch payment reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
          {
            id: 'report-1',
            type: 'payment_reports',
            attributes: { total_amount: 5000, group: 'Payment A' },
          },
        ],
        { format: 'human' },
      );

      await reportsPayment(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('payment_reports', expect.anything());
    });

    it('should parse generic filter for payment reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsPayment(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'payment_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });

    it('should apply date and company filters for payment reports', async () => {
      const { ctx, getReports } = createReportCtx([], {
        company: '123',
        from: '2024-01-01',
        to: '2024-12-31',
      });

      await reportsPayment(ctx);

      expect(getReports).toHaveBeenCalledWith(
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
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'service_reports',
          attributes: { total_budget_time: 960, total_worked_time: 480, total_revenue: 10000 },
        },
      ]);

      await reportsService(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'service_reports',
        expect.objectContaining({ group: 'service', include: ['service'] }),
      );
    });

    it('should fetch service reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
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
        { format: 'human' },
      );

      await reportsService(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('service_reports', expect.anything());
    });

    it('should filter by project and deal', async () => {
      const { ctx, getReports } = createReportCtx([], { project: '123', deal: '456' });

      await reportsService(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'service_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ project_id: '123', deal_id: '456' }),
        }),
      );
    });

    it('should parse generic filter for service reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsService(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'service_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });
  });

  describe('task reports', () => {
    it('should fetch task reports', async () => {
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'task_reports',
          attributes: { total_tasks: 10, total_completed_tasks: 5, total_worked_time: 480 },
        },
      ]);

      await reportsTask(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'task_reports',
        expect.objectContaining({ group: 'task', include: ['task'] }),
      );
    });

    it('should fetch task reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
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
        { format: 'human' },
      );

      await reportsTask(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('task_reports', expect.anything());
    });

    it('should filter by project and person (assignee)', async () => {
      const { ctx, getReports } = createReportCtx([], {
        project: '123',
        person: '456',
        status: 'open',
      });

      await reportsTask(ctx);

      expect(getReports).toHaveBeenCalledWith(
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
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsTask(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'task_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });
  });

  describe('company reports', () => {
    it('should fetch company reports', async () => {
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'company_reports',
          attributes: { total_revenue: 50000, total_cost: 25000, average_profit_margin: 50 },
        },
      ]);

      await reportsCompany(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'company_reports',
        expect.objectContaining({ group: 'company', include: ['company'] }),
      );
    });

    it('should fetch company reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
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
        { format: 'human' },
      );

      await reportsCompany(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('company_reports', expect.anything());
    });

    it('should parse generic filter for company reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsCompany(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'company_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });

    it('should apply date filters for company reports', async () => {
      const { ctx, getReports } = createReportCtx([], { from: '2024-01-01', to: '2024-12-31' });

      await reportsCompany(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'company_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ after: '2024-01-01', before: '2024-12-31' }),
        }),
      );
    });
  });

  describe('deal reports', () => {
    it('should fetch deal reports', async () => {
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'deal_reports',
          attributes: { total_value: 100000, total_won_value: 50000 },
        },
      ]);

      await reportsDeal(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'deal_reports',
        expect.objectContaining({ group: 'deal', include: ['deal'] }),
      );
    });

    it('should fetch deal reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
          {
            id: 'report-1',
            type: 'deal_reports',
            attributes: { total_value: 100000, total_won_value: 50000, group: 'Deal A' },
          },
        ],
        { format: 'human' },
      );

      await reportsDeal(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('deal_reports', expect.anything());
    });

    it('should apply date filters for deal reports', async () => {
      const { ctx, getReports } = createReportCtx([], { from: '2024-01-01', to: '2024-12-31' });

      await reportsDeal(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'deal_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ date_after: '2024-01-01', date_before: '2024-12-31' }),
        }),
      );
    });

    it('should parse generic filter for deal reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsDeal(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'deal_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });

    it('should filter by company and status', async () => {
      const { ctx, getReports } = createReportCtx([], {
        company: '123',
        status: '456',
        from: '2024-01-01',
        to: '2024-12-31',
      });

      await reportsDeal(ctx);

      expect(getReports).toHaveBeenCalledWith(
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
      const { ctx, getReports } = createReportCtx([
        {
          id: 'report-1',
          type: 'timesheet_reports',
          attributes: { status: 'approved', total_time: 2400 },
        },
      ]);

      await reportsTimesheet(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'timesheet_reports',
        expect.objectContaining({ include: ['person'] }),
      );
    });

    it('should fetch timesheet reports in human format', async () => {
      const { ctx, getReports } = createReportCtx(
        [
          {
            id: 'report-1',
            type: 'timesheet_reports',
            attributes: { status: 'approved', total_time: 2400, group: 'Person A' },
          },
        ],
        { format: 'human' },
      );

      await reportsTimesheet(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(getReports).toHaveBeenCalledWith('timesheet_reports', expect.anything());
    });

    it('should apply date filters for timesheet reports', async () => {
      const { ctx, getReports } = createReportCtx([], { from: '2024-01-01', to: '2024-01-31' });

      await reportsTimesheet(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'timesheet_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ after: '2024-01-01', before: '2024-01-31' }),
        }),
      );
    });

    it('should parse generic filter for timesheet reports', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'custom_key=custom_value' });

      await reportsTimesheet(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'timesheet_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ custom_key: 'custom_value' }),
        }),
      );
    });

    it('should filter by person and status', async () => {
      const { ctx, getReports } = createReportCtx([], {
        person: '123',
        status: 'pending',
        from: '2024-01-01',
        to: '2024-01-31',
      });

      await reportsTimesheet(ctx);

      expect(getReports).toHaveBeenCalledWith(
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
      const { ProductiveApiError } = await import('@studiometa/productive-api');
      const getReports = vi.fn().mockRejectedValue(new ProductiveApiError('API Error', 500));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getReports } as unknown as ProductiveApi,
      });

      await reportsTime(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unexpected errors', async () => {
      const getReports = vi.fn().mockRejectedValue(new Error('Unexpected error'));
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        api: { getReports } as unknown as ProductiveApi,
      });

      await reportsTime(ctx);

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleReportsCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('pagination', () => {
    it('should handle pagination options', async () => {
      const { ctx, getReports } = createReportCtx([], { page: '2', size: '50' });

      await reportsTime(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({ page: 2, perPage: 50 }),
      );
    });
  });

  describe('generic filters', () => {
    it('should parse filter string into key-value pairs', async () => {
      const { ctx, getReports } = createReportCtx([], { filter: 'key1=value1,key2=value2' });

      await reportsTime(ctx);

      expect(getReports).toHaveBeenCalledWith(
        'time_reports',
        expect.objectContaining({
          filter: expect.objectContaining({ key1: 'value1', key2: 'value2' }),
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
    vi.restoreAllMocks();
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
