/**
 * CLI adapter for reports command handlers.
 */

import {
  fromCommandContext,
  getReport,
  type GetReportOptions,
  type ReportType,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { runCommand } from '../../error-handler.js';
import { parseFilters } from '../../utils/parse-filters.js';

function formatReportData(data: unknown[]): unknown[] {
  return data.map((item: unknown) => {
    const record = item as { id: string; type: string; attributes: Record<string, unknown> };
    return {
      id: record.id,
      type: record.type,
      ...record.attributes,
    };
  });
}

/**
 * Build common report options from CLI context.
 */
function buildReportOptions(
  ctx: CommandContext,
  reportType: ReportType,
  extraFilters?: (filters: Record<string, string>) => void,
): GetReportOptions {
  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (extraFilters) extraFilters(additionalFilters);

  const { page, perPage } = ctx.getPagination();

  return {
    reportType,
    page,
    perPage,
    group: ctx.options.group ? String(ctx.options.group) : undefined,
    from: ctx.options.from ? String(ctx.options.from) : undefined,
    to: ctx.options.to ? String(ctx.options.to) : undefined,
    personId: ctx.options.person ? String(ctx.options.person) : undefined,
    projectId: ctx.options.project ? String(ctx.options.project) : undefined,
    companyId: ctx.options.company ? String(ctx.options.company) : undefined,
    dealId: ctx.options.deal ? String(ctx.options.deal) : undefined,
    status: ctx.options.status ? String(ctx.options.status) : undefined,
    additionalFilters: Object.keys(additionalFilters).length > 0 ? additionalFilters : undefined,
  };
}

type ReportRenderer = (formattedData: unknown[], group: string) => void;

/**
 * Generic report handler — used by all report types.
 */
async function runReport(
  ctx: CommandContext,
  reportType: ReportType,
  label: string,
  humanRenderer: ReportRenderer,
  extraFilters?: (filters: Record<string, string>) => void,
): Promise<void> {
  const spinner = ctx.createSpinner(`Fetching ${label}...`);
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const options = buildReportOptions(ctx, reportType, extraFilters);

    // Resolve filters for time reports (human-friendly identifiers)
    if (reportType === 'time_reports' && options.additionalFilters) {
      const { resolved } = await ctx.resolveFilters(options.additionalFilters);
      options.additionalFilters = resolved;
    }

    const result = await getReport(options, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(result.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: result.meta });
    } else {
      const group = options.group || reportType.replace('_reports', '');
      humanRenderer(formattedData, group);
    }
  }, ctx.formatter);
}

// ── Report type handlers ───────────────────────────────────────────

export async function reportsTime(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'time_reports', 'time reports', (data, group) => {
    console.log(`\nTime Report (grouped by ${group})\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const workedTime = Number(record.total_worked_time || 0);
      const hours = Math.floor(workedTime / 60);
      const minutes = workedTime % 60;
      console.log(`  ${record.group || record.id}: ${hours}h ${minutes}m`);
    }
    console.log();
  });
}

export async function reportsProject(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'project_reports', 'project reports', (data) => {
    console.log(`\nProject Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const revenue = Number(record.total_revenue_default || 0);
      const cost = Number(record.total_cost_default || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Revenue: ${revenue.toFixed(2)}`);
      console.log(`    Cost: ${cost.toFixed(2)}`);
      console.log(`    Profit margin: ${record.average_profit_margin_default || 0}%`);
    }
    console.log();
  });
}

export async function reportsBudget(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'budget_reports', 'budget reports', (data) => {
    console.log(`\nBudget Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const budgetTime = Number(record.total_budget_time || 0);
      const workedTime = Number(record.total_worked_time || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Budget: ${Math.floor(budgetTime / 60)}h`);
      console.log(`    Worked: ${Math.floor(workedTime / 60)}h`);
    }
    console.log();
  });
}

export async function reportsPerson(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'person_reports', 'person reports', (data) => {
    console.log(`\nPerson Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const workedTime = Number(record.total_worked_time || 0);
      const billableTime = Number(record.total_billable_time || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Worked: ${Math.floor(workedTime / 60)}h`);
      console.log(`    Billable: ${Math.floor(billableTime / 60)}h`);
    }
    console.log();
  });
}

export async function reportsInvoice(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'invoice_reports', 'invoice reports', (data) => {
    console.log(`\nInvoice Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const totalAmount = Number(record.total_amount || 0);
      const paidAmount = Number(record.total_paid_amount || 0);
      const outstandingAmount = Number(record.total_outstanding_amount || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Total: ${totalAmount.toFixed(2)}`);
      console.log(`    Paid: ${paidAmount.toFixed(2)}`);
      console.log(`    Outstanding: ${outstandingAmount.toFixed(2)}`);
    }
    console.log();
  });
}

export async function reportsPayment(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'payment_reports', 'payment reports', (data) => {
    console.log(`\nPayment Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const totalAmount = Number(record.total_amount || 0);
      console.log(`  ${record.group || record.id}: ${totalAmount.toFixed(2)}`);
    }
    console.log();
  });
}

export async function reportsService(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'service_reports', 'service reports', (data) => {
    console.log(`\nService Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const budgetTime = Number(record.total_budget_time || 0);
      const workedTime = Number(record.total_worked_time || 0);
      const revenue = Number(record.total_revenue || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Budget: ${Math.floor(budgetTime / 60)}h`);
      console.log(`    Worked: ${Math.floor(workedTime / 60)}h`);
      console.log(`    Revenue: ${revenue.toFixed(2)}`);
    }
    console.log();
  });
}

export async function reportsTask(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'task_reports', 'task reports', (data) => {
    console.log(`\nTask Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const totalTasks = Number(record.total_tasks || 0);
      const completedTasks = Number(record.total_completed_tasks || 0);
      const workedTime = Number(record.total_worked_time || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Tasks: ${completedTasks}/${totalTasks}`);
      console.log(`    Worked: ${Math.floor(workedTime / 60)}h`);
    }
    console.log();
  });
}

export async function reportsCompany(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'company_reports', 'company reports', (data) => {
    console.log(`\nCompany Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const revenue = Number(record.total_revenue || 0);
      const cost = Number(record.total_cost || 0);
      const profitMargin = Number(record.average_profit_margin || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Revenue: ${revenue.toFixed(2)}`);
      console.log(`    Cost: ${cost.toFixed(2)}`);
      console.log(`    Profit margin: ${profitMargin.toFixed(1)}%`);
    }
    console.log();
  });
}

export async function reportsDeal(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'deal_reports', 'deal reports', (data) => {
    console.log(`\nDeal Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const totalValue = Number(record.total_value || 0);
      const wonValue = Number(record.total_won_value || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Total value: ${totalValue.toFixed(2)}`);
      console.log(`    Won value: ${wonValue.toFixed(2)}`);
    }
    console.log();
  });
}

export async function reportsTimesheet(ctx: CommandContext): Promise<void> {
  await runReport(ctx, 'timesheet_reports', 'timesheet reports', (data) => {
    console.log(`\nTimesheet Report\n`);
    for (const item of data) {
      const record = item as Record<string, unknown>;
      const status = record.status || 'unknown';
      const totalTime = Number(record.total_time || 0);
      console.log(`  ${record.group || record.id}:`);
      console.log(`    Status: ${status}`);
      console.log(`    Total: ${Math.floor(totalTime / 60)}h`);
    }
    console.log();
  });
}
