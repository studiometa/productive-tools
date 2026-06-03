/**
 * CLI adapter for services command handlers.
 */

import { formatService, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  getService,
  listServices,
  type ListServicesOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { runCommand, exitWithValidationError } from '../../error-handler.js';
import { render, createRenderContext } from '../../renderers/index.js';
import { parseFilters } from '../../utils/parse-filters.js';

function parseListOptions(ctx: CommandContext): ListServicesOptions {
  const options: ListServicesOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.deal) options.dealId = String(ctx.options.deal);
  if (ctx.options.task) options.taskId = String(ctx.options.task);
  if (ctx.options.person) options.personId = String(ctx.options.person);
  if (ctx.options['budget-status']) options.budgetStatus = String(ctx.options['budget-status']);
  if (ctx.options['billing-type']) options.billingType = String(ctx.options['billing-type']);
  if (ctx.options['time-tracking'] !== undefined)
    options.timeTracking = ctx.options['time-tracking'] === true;

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.include = ctx.getInclude();

  return options;
}

export async function servicesList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching services...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listServices(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatService, result.meta, {
      included: result.included,
    });

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((s) => ({
        id: s.id,
        name: s.attributes.name,
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('service', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function servicesGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive services get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching service...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getService({ id, include: ctx.getInclude() }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatService(result.data, { included: result.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('service', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}
