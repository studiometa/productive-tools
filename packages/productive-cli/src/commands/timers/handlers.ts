/**
 * CLI adapter for timers command handlers.
 */

import {
  fromCommandContext,
  listTimers,
  startTimer,
  stopTimer,
  type ListTimersOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { formatTimer, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanTimerDetailRenderer } from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';

function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;
  filterString.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) filters[key.trim()] = value.trim();
  });
  return filters;
}

function parseListOptions(ctx: CommandContext): ListTimersOptions {
  const options: ListTimersOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.mine && ctx.config.userId) {
    options.personId = ctx.config.userId;
  } else if (ctx.options.person) {
    options.personId = String(ctx.options.person);
  }

  // Filter by time entry
  if (ctx.options['time-entry']) {
    if (!options.additionalFilters) options.additionalFilters = {};
    options.additionalFilters.time_entry_id = String(ctx.options['time-entry']);
  }

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort() || '-started_at';
  options.include = ['time_entry'];

  return options;
}

export async function timersList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching timers...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listTimers(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatTimer, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((t) => ({
        id: t.id,
        started_at: t.attributes.started_at,
        stopped_at: t.attributes.stopped_at || 'running',
        total_time: t.attributes.total_time,
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('timer', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function timersGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive timers get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching timer...');
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getTimer(id, { include: ['time_entry'] });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatTimer(response.data);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanTimerDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function timersStart(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Starting timer...');
  spinner.start();

  if (!ctx.options.service && !ctx.options['time-entry']) {
    spinner.fail();
    handleError(
      ValidationError.invalid(
        'options',
        undefined,
        'Must specify --service or --time-entry to start a timer',
      ),
      ctx.formatter,
    );
    return;
  }

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await startTimer(
      {
        serviceId: ctx.options.service ? String(ctx.options.service) : undefined,
        timeEntryId: ctx.options['time-entry'] ? String(ctx.options['time-entry']) : undefined,
      },
      execCtx,
    );

    spinner.succeed();

    const timer = result.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ status: 'success', ...formatTimer(timer) });
    } else {
      ctx.formatter.success('Timer started');
      console.log(colors.cyan('ID:'), timer.id);
      console.log(colors.cyan('Started at:'), timer.attributes.started_at);
    }
  }, ctx.formatter);
}

export async function timersStop(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive timers stop <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Stopping timer...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await stopTimer({ id }, execCtx);

    spinner.succeed();

    const timer = result.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ status: 'success', ...formatTimer(timer) });
    } else {
      ctx.formatter.success('Timer stopped');
      console.log(colors.cyan('ID:'), timer.id);
      console.log(colors.cyan('Total time:'), `${timer.attributes.total_time} minutes`);
    }
  }, ctx.formatter);
}
