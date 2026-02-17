/**
 * CLI adapter for budgets command handlers.
 */

import { formatBudget, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  listBudgets,
  getBudget,
  type ListBudgetsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { runCommand, exitWithValidationError } from '../../error-handler.js';
import { render, createRenderContext, humanBudgetDetailRenderer } from '../../renderers/index.js';
import { parseFilters } from '../../utils/parse-filters.js';

function parseListOptions(ctx: CommandContext): ListBudgetsOptions {
  const options: ListBudgetsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.company) options.companyId = String(ctx.options.company);
  if (ctx.options.deal) options.dealId = String(ctx.options.deal);
  if (ctx.options.billable !== undefined)
    options.billable = ctx.options.billable === true || ctx.options.billable === 'true';
  if (ctx.options['budget-type']) options.budgetType = String(ctx.options['budget-type']);

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
        name: b.attributes.name || '',
        billable: b.attributes.billable ?? '',
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

export async function budgetsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive budgets get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching budget...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getBudget({ id }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatBudget(result.data);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanBudgetDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}
