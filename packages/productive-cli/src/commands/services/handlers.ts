/**
 * Handler implementations for services command
 */

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { runCommand } from '../../error-handler.js';
import { formatService, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext } from '../../renderers/index.js';

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
 * List services
 */
export async function servicesList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching services...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Resource filtering
    if (ctx.options.project) {
      filter.project_id = String(ctx.options.project);
    }
    if (ctx.options.deal) {
      filter.deal_id = String(ctx.options.deal);
    }
    if (ctx.options.task) {
      filter.task_id = String(ctx.options.task);
    }
    if (ctx.options.person) {
      filter.person_id = String(ctx.options.person);
    }

    // Budget status filtering (open/delivered)
    if (ctx.options['budget-status']) {
      const statusMap: Record<string, string> = {
        open: '1',
        delivered: '2',
      };
      const statusValue = statusMap[String(ctx.options['budget-status']).toLowerCase()];
      if (statusValue) {
        filter.budget_status = statusValue;
      }
    }

    // Billing type filtering (fixed/actuals/none)
    if (ctx.options['billing-type']) {
      const billingMap: Record<string, string> = {
        fixed: '1',
        actuals: '2',
        none: '3',
      };
      const billingValue = billingMap[String(ctx.options['billing-type']).toLowerCase()];
      if (billingValue) {
        filter.billing_type = billingValue;
      }
    }

    // Boolean filters
    if (ctx.options['time-tracking'] !== undefined) {
      filter.time_tracking_enabled = ctx.options['time-tracking'] ? 'true' : 'false';
    }

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getServices({
      page,
      perPage,
      filter,
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(response.data, formatService, response.meta);

    if (format === 'csv' || format === 'table') {
      // For CSV/table, flatten the data for OutputFormatter
      const data = response.data.map((s) => ({
        id: s.id,
        name: s.attributes.name,
      }));
      ctx.formatter.output(data);
    } else {
      // Use renderer for json and human formats
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      render('service', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}
