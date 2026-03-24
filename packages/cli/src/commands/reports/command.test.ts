import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { reportsCommandConfig } from './command.js';
import {
  reportsTime, reportsProject, reportsBudget, reportsPerson, reportsInvoice, reportsPayment, reportsService, reportsTask, reportsCompany, reportsDeal, reportsTimesheet } from './handlers.js';

describe('reports command wiring', () => {
  it('uses "reports" as resource name', () => {
    expect(reportsCommandConfig.resource).toBe('reports');
  });

  it('wires time to reportsTime', () => {
    expect(reportsCommandConfig.handlers.time).toBe(reportsTime);
  });

  it('wires project and projects to reportsProject', () => {
    expect(reportsCommandConfig.handlers.project).toBe(reportsProject);
    expect(reportsCommandConfig.handlers.projects).toBe(reportsProject);
  });

  it('wires budget and budgets to reportsBudget', () => {
    expect(reportsCommandConfig.handlers.budget).toBe(reportsBudget);
    expect(reportsCommandConfig.handlers.budgets).toBe(reportsBudget);
  });

  it('wires person and people to reportsPerson', () => {
    expect(reportsCommandConfig.handlers.person).toBe(reportsPerson);
    expect(reportsCommandConfig.handlers.people).toBe(reportsPerson);
  });

  it('wires invoice and invoices to reportsInvoice', () => {
    expect(reportsCommandConfig.handlers.invoice).toBe(reportsInvoice);
    expect(reportsCommandConfig.handlers.invoices).toBe(reportsInvoice);
  });

  it('wires payment and payments to reportsPayment', () => {
    expect(reportsCommandConfig.handlers.payment).toBe(reportsPayment);
    expect(reportsCommandConfig.handlers.payments).toBe(reportsPayment);
  });

  it('wires service and services to reportsService', () => {
    expect(reportsCommandConfig.handlers.service).toBe(reportsService);
    expect(reportsCommandConfig.handlers.services).toBe(reportsService);
  });

  it('wires task and tasks to reportsTask', () => {
    expect(reportsCommandConfig.handlers.task).toBe(reportsTask);
    expect(reportsCommandConfig.handlers.tasks).toBe(reportsTask);
  });

  it('wires company and companies to reportsCompany', () => {
    expect(reportsCommandConfig.handlers.company).toBe(reportsCompany);
    expect(reportsCommandConfig.handlers.companies).toBe(reportsCompany);
  });

  it('wires deal and deals to reportsDeal', () => {
    expect(reportsCommandConfig.handlers.deal).toBe(reportsDeal);
    expect(reportsCommandConfig.handlers.deals).toBe(reportsDeal);
  });

  it('wires timesheet and timesheets to reportsTimesheet', () => {
    expect(reportsCommandConfig.handlers.timesheet).toBe(reportsTimesheet);
    expect(reportsCommandConfig.handlers.timesheets).toBe(reportsTimesheet);
  });
});

describe('reports command routing', () => {
  const mockReportsTime = vi.fn().mockResolvedValue(undefined);
  const mockReportsProject = vi.fn().mockResolvedValue(undefined);
  const mockReportsBudget = vi.fn().mockResolvedValue(undefined);
  const mockReportsPerson = vi.fn().mockResolvedValue(undefined);
  const mockReportsInvoice = vi.fn().mockResolvedValue(undefined);
  const mockReportsPayment = vi.fn().mockResolvedValue(undefined);
  const mockReportsService = vi.fn().mockResolvedValue(undefined);
  const mockReportsTask = vi.fn().mockResolvedValue(undefined);
  const mockReportsCompany = vi.fn().mockResolvedValue(undefined);
  const mockReportsDeal = vi.fn().mockResolvedValue(undefined);
  const mockReportsTimesheet = vi.fn().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'reports',
    handlers: {
      time: mockReportsTime,
      project: mockReportsProject,
      projects: mockReportsProject,
      budget: mockReportsBudget,
      budgets: mockReportsBudget,
      person: mockReportsPerson,
      people: mockReportsPerson,
      invoice: mockReportsInvoice,
      invoices: mockReportsInvoice,
      payment: mockReportsPayment,
      payments: mockReportsPayment,
      service: mockReportsService,
      services: mockReportsService,
      task: mockReportsTask,
      tasks: mockReportsTask,
      company: mockReportsCompany,
      companies: mockReportsCompany,
      deal: mockReportsDeal,
      deals: mockReportsDeal,
      timesheet: mockReportsTimesheet,
      timesheets: mockReportsTimesheet,
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockReportsTime.mockClear();
    mockReportsProject.mockClear();
    mockReportsBudget.mockClear();
    mockReportsPerson.mockClear();
    mockReportsInvoice.mockClear();
    mockReportsPayment.mockClear();
    mockReportsService.mockClear();
    mockReportsTask.mockClear();
    mockReportsCompany.mockClear();
    mockReportsDeal.mockClear();
    mockReportsTimesheet.mockClear();
  });

  it('routes "time" subcommand to reportsTime handler', async () => {
    await router('time', [], { format: 'json' });
    expect(mockReportsTime).toHaveBeenCalled();
  });

  it('routes "project" subcommand to reportsProject handler', async () => {
    await router('project', [], { format: 'json' });
    expect(mockReportsProject).toHaveBeenCalled();
  });

  it('routes "projects" alias to reportsProject handler', async () => {
    await router('projects', [], { format: 'json' });
    expect(mockReportsProject).toHaveBeenCalled();
  });

  it('routes "budget" subcommand to reportsBudget handler', async () => {
    await router('budget', [], { format: 'json' });
    expect(mockReportsBudget).toHaveBeenCalled();
  });

  it('routes "budgets" alias to reportsBudget handler', async () => {
    await router('budgets', [], { format: 'json' });
    expect(mockReportsBudget).toHaveBeenCalled();
  });

  it('routes "person" subcommand to reportsPerson handler', async () => {
    await router('person', [], { format: 'json' });
    expect(mockReportsPerson).toHaveBeenCalled();
  });

  it('routes "people" alias to reportsPerson handler', async () => {
    await router('people', [], { format: 'json' });
    expect(mockReportsPerson).toHaveBeenCalled();
  });

  it('routes "invoice" subcommand to reportsInvoice handler', async () => {
    await router('invoice', [], { format: 'json' });
    expect(mockReportsInvoice).toHaveBeenCalled();
  });

  it('routes "invoices" alias to reportsInvoice handler', async () => {
    await router('invoices', [], { format: 'json' });
    expect(mockReportsInvoice).toHaveBeenCalled();
  });

  it('routes "payment" subcommand to reportsPayment handler', async () => {
    await router('payment', [], { format: 'json' });
    expect(mockReportsPayment).toHaveBeenCalled();
  });

  it('routes "payments" alias to reportsPayment handler', async () => {
    await router('payments', [], { format: 'json' });
    expect(mockReportsPayment).toHaveBeenCalled();
  });

  it('routes "service" subcommand to reportsService handler', async () => {
    await router('service', [], { format: 'json' });
    expect(mockReportsService).toHaveBeenCalled();
  });

  it('routes "services" alias to reportsService handler', async () => {
    await router('services', [], { format: 'json' });
    expect(mockReportsService).toHaveBeenCalled();
  });

  it('routes "task" subcommand to reportsTask handler', async () => {
    await router('task', [], { format: 'json' });
    expect(mockReportsTask).toHaveBeenCalled();
  });

  it('routes "tasks" alias to reportsTask handler', async () => {
    await router('tasks', [], { format: 'json' });
    expect(mockReportsTask).toHaveBeenCalled();
  });

  it('routes "company" subcommand to reportsCompany handler', async () => {
    await router('company', [], { format: 'json' });
    expect(mockReportsCompany).toHaveBeenCalled();
  });

  it('routes "companies" alias to reportsCompany handler', async () => {
    await router('companies', [], { format: 'json' });
    expect(mockReportsCompany).toHaveBeenCalled();
  });

  it('routes "deal" subcommand to reportsDeal handler', async () => {
    await router('deal', [], { format: 'json' });
    expect(mockReportsDeal).toHaveBeenCalled();
  });

  it('routes "deals" alias to reportsDeal handler', async () => {
    await router('deals', [], { format: 'json' });
    expect(mockReportsDeal).toHaveBeenCalled();
  });

  it('routes "timesheet" subcommand to reportsTimesheet handler', async () => {
    await router('timesheet', [], { format: 'json' });
    expect(mockReportsTimesheet).toHaveBeenCalled();
  });

  it('routes "timesheets" alias to reportsTimesheet handler', async () => {
    await router('timesheets', [], { format: 'json' });
    expect(mockReportsTimesheet).toHaveBeenCalled();
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown reports subcommand: unknown'),
    );
  });
});
