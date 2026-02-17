/**
 * CLI adapter for bookings command handlers.
 */

import { formatBooking, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  getBooking,
  listBookings,
  createBooking,
  updateBooking,
  type ListBookingsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { render, createRenderContext, humanBookingDetailRenderer } from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';
import { parseFilters } from '../../utils/parse-filters.js';

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function parseListOptions(ctx: CommandContext): ListBookingsOptions {
  const options: ListBookingsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));

  if (ctx.options.mine && ctx.config.userId) {
    options.personId = ctx.config.userId;
  } else if (ctx.options.person) {
    options.personId = String(ctx.options.person);
  }
  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.company) options.companyId = String(ctx.options.company);
  if (ctx.options.service) options.serviceId = String(ctx.options.service);
  if (ctx.options.event) options.eventId = String(ctx.options.event);
  if (ctx.options.from) options.after = String(ctx.options.from);
  if (ctx.options.to) options.before = String(ctx.options.to);

  // Booking type filtering
  if (ctx.options.type) {
    const typeValue = String(ctx.options.type).toLowerCase();
    if (typeValue === 'absence' || typeValue === 'event') {
      additionalFilters.booking_type = 'event';
    } else if (typeValue === 'budget' || typeValue === 'service') {
      additionalFilters.booking_type = 'service';
    }
  }

  if (ctx.options.tentative !== undefined) {
    options.draft = ctx.options.tentative === true;
  }

  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort() || 'started_on';
  options.include = ['person', 'service'];

  return options;
}

export async function bookingsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching bookings...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listBookings(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatBooking, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((b) => ({
        id: b.id,
        start: b.attributes.started_on,
        end: b.attributes.ended_on,
        time: b.attributes.time ? formatDuration(b.attributes.time) : '',
        total: b.attributes.total_time ? formatDuration(b.attributes.total_time) : '',
        draft: b.attributes.draft ? 'tentative' : 'confirmed',
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('booking', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function bookingsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive bookings get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching booking...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getBooking(
      { id, include: ['person', 'service', 'event', 'approver'] },
      execCtx,
    );

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatBooking(result.data, { included: result.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanBookingDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function bookingsAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating booking...');
  spinner.start();

  const personId = String(ctx.options.person || ctx.config.userId || '');
  if (!personId) {
    spinner.fail();
    handleError(ValidationError.required('person'), ctx.formatter);
    return;
  }
  if (!ctx.options.from) {
    spinner.fail();
    handleError(ValidationError.required('from'), ctx.formatter);
    return;
  }
  if (!ctx.options.to) {
    spinner.fail();
    handleError(ValidationError.required('to'), ctx.formatter);
    return;
  }
  if (!ctx.options.service && !ctx.options.event) {
    spinner.fail();
    handleError(
      ValidationError.invalid('options', undefined, 'Must specify --service or --event'),
      ctx.formatter,
    );
    return;
  }

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await createBooking(
      {
        personId,
        serviceId: ctx.options.service ? String(ctx.options.service) : undefined,
        eventId: ctx.options.event ? String(ctx.options.event) : undefined,
        startedOn: String(ctx.options.from),
        endedOn: String(ctx.options.to),
        time: ctx.options.time ? parseInt(String(ctx.options.time)) : undefined,
        totalTime: ctx.options['total-time']
          ? parseInt(String(ctx.options['total-time']))
          : undefined,
        percentage: ctx.options.percentage ? parseInt(String(ctx.options.percentage)) : undefined,
        draft: ctx.options.tentative === true,
        note: ctx.options.note ? String(ctx.options.note) : undefined,
      },
      execCtx,
    );

    spinner.succeed();

    const booking = result.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ status: 'success', ...formatBooking(booking) });
    } else {
      ctx.formatter.success('Booking created');
      console.log(colors.cyan('ID:'), booking.id);
      console.log(
        colors.cyan('Period:'),
        `${booking.attributes.started_on} → ${booking.attributes.ended_on}`,
      );
      if (booking.attributes.draft) console.log(colors.yellow('Status: Tentative'));
    }
  }, ctx.formatter);
}

export async function bookingsUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id)
    exitWithValidationError('id', 'productive bookings update <id> [options]', ctx.formatter);

  const spinner = ctx.createSpinner('Updating booking...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    // Build draft value: --confirm overrides --tentative
    let draft: boolean | undefined;
    if (ctx.options.confirm !== undefined) draft = false;
    else if (ctx.options.tentative !== undefined) draft = ctx.options.tentative === true;

    const result = await updateBooking(
      {
        id,
        startedOn: ctx.options.from !== undefined ? String(ctx.options.from) : undefined,
        endedOn: ctx.options.to !== undefined ? String(ctx.options.to) : undefined,
        time: ctx.options.time !== undefined ? parseInt(String(ctx.options.time)) : undefined,
        totalTime:
          ctx.options['total-time'] !== undefined
            ? parseInt(String(ctx.options['total-time']))
            : undefined,
        percentage:
          ctx.options.percentage !== undefined
            ? parseInt(String(ctx.options.percentage))
            : undefined,
        draft,
        note: ctx.options.note !== undefined ? String(ctx.options.note) : undefined,
      },
      execCtx,
    );

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', id: result.data.id });
    } else {
      ctx.formatter.success(`Booking ${id} updated`);
    }
  }, ctx.formatter);
}
