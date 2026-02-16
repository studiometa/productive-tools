/**
 * CLI adapter for people command handlers.
 */

import {
  fromCommandContext,
  listPeople,
  getPerson,
  type ListPeopleOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { exitWithValidationError, runCommand } from '../../error-handler.js';
import { formatPerson, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanPersonDetailRenderer } from '../../renderers/index.js';

function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;
  filterString.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) filters[key.trim()] = value.trim();
  });
  return filters;
}

function parseListOptions(ctx: CommandContext): ListPeopleOptions {
  const options: ListPeopleOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.company) options.companyId = String(ctx.options.company);
  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.role) options.role = String(ctx.options.role);
  if (ctx.options.team) options.team = String(ctx.options.team);
  if (ctx.options.type) options.personType = String(ctx.options.type);
  if (ctx.options.status) options.status = String(ctx.options.status);

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort();

  return options;
}

export async function peopleList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching people...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listPeople(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatPerson, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((p) => ({
        id: p.id,
        first_name: p.attributes.first_name,
        last_name: p.attributes.last_name,
        email: p.attributes.email,
        active: p.attributes.active ? 'yes' : 'no',
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('person', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function peopleGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive people get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching person...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getPerson({ id }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatPerson(result.data);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanPersonDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}
