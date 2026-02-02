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

    if (ctx.options.project) {
      filter.project_id = String(ctx.options.project);
    }
    if (ctx.options.deal) {
      filter.deal_id = String(ctx.options.deal);
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
