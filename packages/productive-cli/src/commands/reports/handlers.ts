/**
 * Handler implementations for reports command
 */

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { runCommand } from '../../error-handler.js';
import { resolveCommandFilters } from '../../utils/resolve-filters.js';

/**
 * Parse filter string into key-value pairs
 */
function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;

  filterString.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      filters[key.trim()] = value.trim();
    }
  });
  return filters;
}

/**
 * Format report data for output
 */
function formatReportData(data: unknown[]): unknown[] {
  return data.map((item: unknown) => {
    const record = item as { id: string; type: string; attributes: Record<string, unknown> };
    // Flatten attributes for easier reading
    return {
      id: record.id,
      type: record.type,
      ...record.attributes,
    };
  });
}

/**
 * Time reports
 */
export async function reportsTime(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching time reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Date filters
    if (ctx.options.from) filter.after = String(ctx.options.from);
    if (ctx.options.to) filter.before = String(ctx.options.to);
    if (ctx.options.person) filter.person_id = String(ctx.options.person);
    if (ctx.options.project) filter.project_id = String(ctx.options.project);

    // Resolve any human-friendly identifiers
    const { resolved: resolvedFilter } = await resolveCommandFilters(ctx, filter);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'person';

    const response = await ctx.api.getReports('time_reports', {
      page,
      perPage,
      filter: resolvedFilter,
      group,
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      // For human format, show summary
      console.log(`\nTime Report (grouped by ${group})\n`);
      for (const item of formattedData) {
        const record = item as Record<string, unknown>;
        const workedTime = Number(record.total_worked_time || 0);
        const hours = Math.floor(workedTime / 60);
        const minutes = workedTime % 60;
        console.log(`  ${record.group || record.id}: ${hours}h ${minutes}m`);
      }
      console.log();
    }
  }, ctx.formatter);
}

/**
 * Project reports
 */
export async function reportsProject(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching project reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.company) filter.company_id = String(ctx.options.company);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'project';

    const response = await ctx.api.getReports('project_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['project'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nProject Report\n`);
      for (const item of formattedData) {
        const record = item as Record<string, unknown>;
        const revenue = Number(record.total_revenue_default || 0);
        const cost = Number(record.total_cost_default || 0);
        console.log(`  ${record.group || record.id}:`);
        console.log(`    Revenue: ${revenue.toFixed(2)}`);
        console.log(`    Cost: ${cost.toFixed(2)}`);
        console.log(`    Profit margin: ${record.average_profit_margin_default || 0}%`);
      }
      console.log();
    }
  }, ctx.formatter);
}

/**
 * Budget reports
 */
export async function reportsBudget(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching budget reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.company) filter.company_id = String(ctx.options.company);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'deal';

    const response = await ctx.api.getReports('budget_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['deal'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nBudget Report\n`);
      for (const item of formattedData) {
        const record = item as Record<string, unknown>;
        const budgetTime = Number(record.total_budget_time || 0);
        const workedTime = Number(record.total_worked_time || 0);
        console.log(`  ${record.group || record.id}:`);
        console.log(`    Budget: ${Math.floor(budgetTime / 60)}h`);
        console.log(`    Worked: ${Math.floor(workedTime / 60)}h`);
      }
      console.log();
    }
  }, ctx.formatter);
}

/**
 * Person reports
 */
export async function reportsPerson(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching person reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.from) filter.after = String(ctx.options.from);
    if (ctx.options.to) filter.before = String(ctx.options.to);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'person';

    const response = await ctx.api.getReports('person_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['person'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nPerson Report\n`);
      for (const item of formattedData) {
        const record = item as Record<string, unknown>;
        const workedTime = Number(record.total_worked_time || 0);
        const billableTime = Number(record.total_billable_time || 0);
        console.log(`  ${record.group || record.id}:`);
        console.log(`    Worked: ${Math.floor(workedTime / 60)}h`);
        console.log(`    Billable: ${Math.floor(billableTime / 60)}h`);
      }
      console.log();
    }
  }, ctx.formatter);
}

/**
 * Invoice reports
 */
export async function reportsInvoice(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching invoice reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.company) filter.company_id = String(ctx.options.company);
    if (ctx.options.status) filter.status = String(ctx.options.status);
    if (ctx.options.from) filter.invoice_date_after = String(ctx.options.from);
    if (ctx.options.to) filter.invoice_date_before = String(ctx.options.to);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'invoice';

    const response = await ctx.api.getReports('invoice_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['invoice'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nInvoice Report\n`);
      for (const item of formattedData) {
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
    }
  }, ctx.formatter);
}

/**
 * Payment reports
 */
export async function reportsPayment(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching payment reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.company) filter.company_id = String(ctx.options.company);
    if (ctx.options.from) filter.date_after = String(ctx.options.from);
    if (ctx.options.to) filter.date_before = String(ctx.options.to);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'payment';

    const response = await ctx.api.getReports('payment_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['payment'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nPayment Report\n`);
      for (const item of formattedData) {
        const record = item as Record<string, unknown>;
        const totalAmount = Number(record.total_amount || 0);
        console.log(`  ${record.group || record.id}: ${totalAmount.toFixed(2)}`);
      }
      console.log();
    }
  }, ctx.formatter);
}

/**
 * Service reports
 */
export async function reportsService(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching service reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.project) filter.project_id = String(ctx.options.project);
    if (ctx.options.deal) filter.deal_id = String(ctx.options.deal);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'service';

    const response = await ctx.api.getReports('service_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['service'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nService Report\n`);
      for (const item of formattedData) {
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
    }
  }, ctx.formatter);
}

/**
 * Task reports
 */
export async function reportsTask(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching task reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.project) filter.project_id = String(ctx.options.project);
    if (ctx.options.person) filter.assignee_id = String(ctx.options.person);
    if (ctx.options.status) filter.status = String(ctx.options.status);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'task';

    const response = await ctx.api.getReports('task_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['task'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nTask Report\n`);
      for (const item of formattedData) {
        const record = item as Record<string, unknown>;
        const totalTasks = Number(record.total_tasks || 0);
        const completedTasks = Number(record.total_completed_tasks || 0);
        const workedTime = Number(record.total_worked_time || 0);
        console.log(`  ${record.group || record.id}:`);
        console.log(`    Tasks: ${completedTasks}/${totalTasks}`);
        console.log(`    Worked: ${Math.floor(workedTime / 60)}h`);
      }
      console.log();
    }
  }, ctx.formatter);
}

/**
 * Company reports
 */
export async function reportsCompany(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching company reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.from) filter.after = String(ctx.options.from);
    if (ctx.options.to) filter.before = String(ctx.options.to);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'company';

    const response = await ctx.api.getReports('company_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['company'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nCompany Report\n`);
      for (const item of formattedData) {
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
    }
  }, ctx.formatter);
}

/**
 * Deal reports
 */
export async function reportsDeal(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching deal reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.company) filter.company_id = String(ctx.options.company);
    if (ctx.options.status) filter.deal_status_id = String(ctx.options.status);
    if (ctx.options.from) filter.date_after = String(ctx.options.from);
    if (ctx.options.to) filter.date_before = String(ctx.options.to);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : 'deal';

    const response = await ctx.api.getReports('deal_reports', {
      page,
      perPage,
      filter,
      group,
      include: ['deal'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nDeal Report\n`);
      for (const item of formattedData) {
        const record = item as Record<string, unknown>;
        const totalValue = Number(record.total_value || 0);
        const wonValue = Number(record.total_won_value || 0);
        console.log(`  ${record.group || record.id}:`);
        console.log(`    Total value: ${totalValue.toFixed(2)}`);
        console.log(`    Won value: ${wonValue.toFixed(2)}`);
      }
      console.log();
    }
  }, ctx.formatter);
}

/**
 * Timesheet reports
 */
export async function reportsTimesheet(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching timesheet reports...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.person) filter.person_id = String(ctx.options.person);
    if (ctx.options.from) filter.after = String(ctx.options.from);
    if (ctx.options.to) filter.before = String(ctx.options.to);
    if (ctx.options.status) filter.status = String(ctx.options.status);

    const { page, perPage } = ctx.getPagination();

    const response = await ctx.api.getReports('timesheet_reports', {
      page,
      perPage,
      filter,
      include: ['person'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'json') as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === 'json') {
      ctx.formatter.output({ data: formattedData, meta: response.meta });
    } else {
      console.log(`\nTimesheet Report\n`);
      for (const item of formattedData) {
        const record = item as Record<string, unknown>;
        const status = record.status || 'unknown';
        const totalTime = Number(record.total_time || 0);
        console.log(`  ${record.group || record.id}:`);
        console.log(`    Status: ${status}`);
        console.log(`    Total: ${Math.floor(totalTime / 60)}h`);
      }
      console.log();
    }
  }, ctx.formatter);
}
