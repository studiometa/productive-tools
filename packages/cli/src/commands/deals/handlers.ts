/**
 * CLI adapter for deals command handlers.
 */

import { formatDeal, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  ExecutorValidationError,
  type ListDealsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { render, createRenderContext, humanDealDetailRenderer } from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';
import { parseFilters } from '../../utils/parse-filters.js';

function parseListOptions(ctx: CommandContext): ListDealsOptions {
  const options: ListDealsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.company) options.companyId = String(ctx.options.company);
  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.responsible) options.responsibleId = String(ctx.options.responsible);
  if (ctx.options.pipeline) options.pipelineId = String(ctx.options.pipeline);
  if (ctx.options.status) options.status = String(ctx.options.status);
  if (ctx.options.type) options.dealType = String(ctx.options.type);
  if (ctx.options.budget === true) options.dealType = 'budget';
  if (ctx.options['budget-status']) options.budgetStatus = String(ctx.options['budget-status']);

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort();

  return options;
}

export async function dealsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching deals...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listDeals(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatDeal, result.meta, {
      included: result.included,
    });

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((d) => ({
        id: d.id,
        number: d.attributes.number || '',
        name: d.attributes.name,
        type: d.attributes.budget ? 'budget' : 'deal',
        date: d.attributes.date || '',
        created: d.attributes.created_at.split('T')[0],
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('deal', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function dealsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive deals get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching deal...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getDeal({ id }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatDeal(result.data, { included: result.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanDealDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function dealsAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating deal...');
  spinner.start();

  if (!ctx.options.name) {
    spinner.fail();
    handleError(ValidationError.required('name'), ctx.formatter);
    return;
  }
  if (!ctx.options.company) {
    spinner.fail();
    handleError(ValidationError.required('company'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await createDeal(
      {
        name: String(ctx.options.name),
        companyId: String(ctx.options.company),
        date: ctx.options.date ? String(ctx.options.date) : undefined,
        budget: ctx.options.budget === true,
        responsibleId: ctx.options.responsible ? String(ctx.options.responsible) : undefined,
      },
      execCtx,
    );

    spinner.succeed();

    const deal = result.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ status: 'success', ...formatDeal(deal) });
    } else {
      const type = deal.attributes.budget ? 'Budget' : 'Deal';
      ctx.formatter.success(`${type} created`);
      console.log(colors.cyan('ID:'), deal.id);
      console.log(colors.cyan('Name:'), deal.attributes.name);
      if (deal.attributes.number) {
        console.log(colors.cyan('Number:'), `#${deal.attributes.number}`);
      }
    }
  }, ctx.formatter);
}

export async function dealsUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive deals update <id> [options]', ctx.formatter);

  const spinner = ctx.createSpinner('Updating deal...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    try {
      const result = await updateDeal(
        {
          id,
          name: ctx.options.name !== undefined ? String(ctx.options.name) : undefined,
          date: ctx.options.date !== undefined ? String(ctx.options.date) : undefined,
          endDate:
            ctx.options['end-date'] !== undefined ? String(ctx.options['end-date']) : undefined,
          responsibleId:
            ctx.options.responsible !== undefined ? String(ctx.options.responsible) : undefined,
          dealStatusId: ctx.options.status !== undefined ? String(ctx.options.status) : undefined,
        },
        execCtx,
      );

      spinner.succeed();

      const format = ctx.options.format || ctx.options.f || 'human';
      if (format === 'json') {
        ctx.formatter.output({ status: 'success', id: result.data.id });
      } else {
        ctx.formatter.success(`Deal ${id} updated`);
      }
    } catch (error) {
      if (error instanceof ExecutorValidationError) {
        spinner.fail();
        throw ValidationError.invalid(
          'options',
          {},
          'No updates specified. Use --name, --date, --end-date, --responsible, --status, etc.',
        );
      }
      throw error;
    }
  }, ctx.formatter);
}
