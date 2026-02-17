import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { buildReportFilters, getReport, resolveGroup, resolveIncludes } from './get.js';

describe('buildReportFilters', () => {
  it('maps date filters to "after/before" for time_reports', () => {
    const filters = buildReportFilters({
      reportType: 'time_reports',
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(filters).toEqual({ after: '2026-01-01', before: '2026-01-31' });
  });

  it('maps date filters to "invoice_date_after/before" for invoice_reports', () => {
    const filters = buildReportFilters({
      reportType: 'invoice_reports',
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(filters).toEqual({
      invoice_date_after: '2026-01-01',
      invoice_date_before: '2026-01-31',
    });
  });

  it('maps date filters to "date_after/before" for payment_reports', () => {
    const filters = buildReportFilters({
      reportType: 'payment_reports',
      from: '2026-06-01',
      to: '2026-06-30',
    });
    expect(filters).toEqual({ date_after: '2026-06-01', date_before: '2026-06-30' });
  });

  it('maps date filters to "date_after/before" for deal_reports', () => {
    const filters = buildReportFilters({
      reportType: 'deal_reports',
      from: '2026-01-01',
      to: '2026-12-31',
    });
    expect(filters).toEqual({ date_after: '2026-01-01', date_before: '2026-12-31' });
  });

  it('maps date filters to "after/before" for person_reports', () => {
    const filters = buildReportFilters({
      reportType: 'person_reports',
      from: '2026-01-01',
      to: '2026-01-31',
    });
    expect(filters).toEqual({ after: '2026-01-01', before: '2026-01-31' });
  });

  it('maps personId to assignee_id for task_reports', () => {
    const filters = buildReportFilters({
      reportType: 'task_reports',
      personId: '123',
    });
    expect(filters).toEqual({ assignee_id: '123' });
  });

  it('maps personId to person_id for other report types', () => {
    const filters = buildReportFilters({
      reportType: 'time_reports',
      personId: '123',
    });
    expect(filters).toEqual({ person_id: '123' });
  });

  it('maps dealId to deal_status_id for deal_reports', () => {
    const filters = buildReportFilters({
      reportType: 'deal_reports',
      dealId: '456',
    });
    expect(filters).toEqual({ deal_status_id: '456' });
  });

  it('maps dealId to deal_id for other report types', () => {
    const filters = buildReportFilters({
      reportType: 'budget_reports',
      dealId: '456',
    });
    expect(filters).toEqual({ deal_id: '456' });
  });

  it('maps status to deal_status_id for deal_reports', () => {
    const filters = buildReportFilters({
      reportType: 'deal_reports',
      status: 'won',
    });
    expect(filters).toEqual({ deal_status_id: 'won' });
  });

  it('maps status to status for other report types', () => {
    const filters = buildReportFilters({
      reportType: 'timesheet_reports',
      status: 'approved',
    });
    expect(filters).toEqual({ status: 'approved' });
  });

  it('passes through projectId and companyId', () => {
    const filters = buildReportFilters({
      reportType: 'project_reports',
      projectId: '111',
      companyId: '222',
    });
    expect(filters).toEqual({ project_id: '111', company_id: '222' });
  });

  it('merges additionalFilters', () => {
    const filters = buildReportFilters({
      reportType: 'time_reports',
      personId: '123',
      additionalFilters: { custom_field: 'value' },
    });
    expect(filters).toEqual({ custom_field: 'value', person_id: '123' });
  });

  it('returns empty filter when no options set', () => {
    const filters = buildReportFilters({ reportType: 'time_reports' });
    expect(filters).toEqual({});
  });

  it('combines all filter types', () => {
    const filters = buildReportFilters({
      reportType: 'time_reports',
      from: '2026-01-01',
      to: '2026-01-31',
      personId: '123',
      projectId: '456',
      companyId: '789',
      additionalFilters: { extra: 'true' },
    });
    expect(filters).toEqual({
      extra: 'true',
      after: '2026-01-01',
      before: '2026-01-31',
      person_id: '123',
      project_id: '456',
      company_id: '789',
    });
  });
});

describe('resolveGroup', () => {
  it('returns explicit group when provided', () => {
    expect(resolveGroup('time_reports', 'project')).toBe('project');
  });

  it('returns default group for time_reports', () => {
    expect(resolveGroup('time_reports')).toBe('person');
  });

  it('returns default group for project_reports', () => {
    expect(resolveGroup('project_reports')).toBe('project');
  });

  it('returns default group for budget_reports', () => {
    expect(resolveGroup('budget_reports')).toBe('deal');
  });

  it('returns undefined for timesheet_reports (no default)', () => {
    expect(resolveGroup('timesheet_reports')).toBeUndefined();
  });
});

describe('resolveIncludes', () => {
  it('returns explicit includes when provided', () => {
    expect(resolveIncludes('time_reports', ['custom'])).toEqual(['custom']);
  });

  it('returns default includes for project_reports', () => {
    expect(resolveIncludes('project_reports')).toEqual(['project']);
  });

  it('returns default includes for timesheet_reports', () => {
    expect(resolveIncludes('timesheet_reports')).toEqual(['person']);
  });

  it('returns undefined for time_reports (no default includes)', () => {
    expect(resolveIncludes('time_reports')).toBeUndefined();
  });
});

describe('getReport', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'report', attributes: { total_worked_time: 480 } }],
    meta: { current_page: 1, total_pages: 1 },
    included: [],
  };

  it('calls API with built filters and defaults', async () => {
    const getReports = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getReports } });

    const result = await getReport(
      {
        reportType: 'time_reports',
        from: '2026-01-01',
        to: '2026-01-31',
        personId: '123',
      },
      ctx,
    );

    expect(getReports).toHaveBeenCalledWith('time_reports', {
      page: 1,
      perPage: 100,
      filter: { after: '2026-01-01', before: '2026-01-31', person_id: '123' },
      group: 'person', // default for time_reports
      include: undefined, // no default includes for time_reports
    });
    expect(result.data).toEqual(mockResponse.data);
    expect(result.meta).toEqual(mockResponse.meta);
  });

  it('uses custom pagination, group, and includes', async () => {
    const getReports = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getReports } });

    await getReport(
      {
        reportType: 'project_reports',
        page: 2,
        perPage: 50,
        group: 'company',
        include: ['project', 'company'],
      },
      ctx,
    );

    expect(getReports).toHaveBeenCalledWith('project_reports', {
      page: 2,
      perPage: 50,
      filter: {},
      group: 'company',
      include: ['project', 'company'],
    });
  });

  it('passes invoice-specific date filters', async () => {
    const getReports = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getReports } });

    await getReport(
      {
        reportType: 'invoice_reports',
        from: '2026-01-01',
        to: '2026-06-30',
        companyId: '789',
      },
      ctx,
    );

    expect(getReports).toHaveBeenCalledWith('invoice_reports', {
      page: 1,
      perPage: 100,
      filter: {
        invoice_date_after: '2026-01-01',
        invoice_date_before: '2026-06-30',
        company_id: '789',
      },
      group: 'invoice',
      include: ['invoice'],
    });
  });
});
