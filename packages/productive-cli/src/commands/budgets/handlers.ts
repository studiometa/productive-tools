/**
 * CLI adapter for budgets command handlers.
 */

import {
  fromCommandContext,
  listBudgets,
  type ListBudgetsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { runCommand } from '../../error-handler.js';
import { formatBudget, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext } from '../../renderers/index.js';

function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;
  filterString.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) filters[key.trim()] = value.trim();
  });
  return filters;
}

function parseListOptions(ctx: CommandContext): ListBudgetsOptions {
  const options: ListBudgetsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.company) options.companyId = String(ctx.options.company);

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;

  return options;
}

export async function budgetsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching budgets...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listBudgets(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatBudget, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((b) => ({
        id: b.id,
        time_total: b.attributes.total_time_budget || 0,
        time_remaining: b.attributes.remaining_time_budget || 0,
        money_total: b.attributes.total_monetary_budget || 0,
        money_remaining: b.attributes.remaining_monetary_budget || 0,
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('budget', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}
