/**
 * Handler implementations for reports command
 */

import type { OutputFormat } from "../../types.js";
import { runCommand } from "../../error-handler.js";
import type { CommandContext } from "../../context.js";

/**
 * Parse filter string into key-value pairs
 */
function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;

  filterString.split(",").forEach((pair) => {
    const [key, value] = pair.split("=");
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
  const spinner = ctx.createSpinner("Fetching time reports...");
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

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : "person";

    const response = await ctx.api.getReports("time_reports", {
      page,
      perPage,
      filter,
      group,
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "json") as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === "json") {
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
  const spinner = ctx.createSpinner("Fetching project reports...");
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.company) filter.company_id = String(ctx.options.company);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : "project";

    const response = await ctx.api.getReports("project_reports", {
      page,
      perPage,
      filter,
      group,
      include: ["project"],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "json") as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === "json") {
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
  const spinner = ctx.createSpinner("Fetching budget reports...");
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.company) filter.company_id = String(ctx.options.company);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : "deal";

    const response = await ctx.api.getReports("budget_reports", {
      page,
      perPage,
      filter,
      group,
      include: ["deal"],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "json") as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === "json") {
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
  const spinner = ctx.createSpinner("Fetching person reports...");
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.from) filter.after = String(ctx.options.from);
    if (ctx.options.to) filter.before = String(ctx.options.to);

    const { page, perPage } = ctx.getPagination();
    const group = ctx.options.group ? String(ctx.options.group) : "person";

    const response = await ctx.api.getReports("person_reports", {
      page,
      perPage,
      filter,
      group,
      include: ["person"],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || "json") as OutputFormat;
    const formattedData = formatReportData(response.data);

    if (format === "json") {
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
