/**
 * CLI adapter for bookings command handlers.
 */

import {
  fromCommandContext,
  listBookings,
  type ListBookingsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { formatBooking, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanBookingDetailRenderer } from '../../renderers/index.js';
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
    // Bookings get uses include which the executor doesn't pass through — call API directly
    const response = await ctx.api.getBooking(id, {
      include: ['person', 'service', 'event', 'approver'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatBooking(response.data, { included: response.included });

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
    const resolvedPersonId = await ctx.tryResolveValue(personId, 'person');
    const resolvedServiceId = ctx.options.service
      ? await ctx.tryResolveValue(String(ctx.options.service), 'service')
      : undefined;

    const response = await ctx.api.createBooking({
      person_id: resolvedPersonId,
      service_id: resolvedServiceId,
      event_id: ctx.options.event ? String(ctx.options.event) : undefined,
      started_on: String(ctx.options.from),
      ended_on: String(ctx.options.to),
      time: ctx.options.time ? parseInt(String(ctx.options.time)) : undefined,
      total_time: ctx.options['total-time']
        ? parseInt(String(ctx.options['total-time']))
        : undefined,
      percentage: ctx.options.percentage ? parseInt(String(ctx.options.percentage)) : undefined,
      draft: ctx.options.tentative === true,
      note: ctx.options.note ? String(ctx.options.note) : undefined,
    });

    spinner.succeed();

    const booking = response.data;
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
    const data: Parameters<typeof ctx.api.updateBooking>[1] = {};

    if (ctx.options.from !== undefined) data.started_on = String(ctx.options.from);
    if (ctx.options.to !== undefined) data.ended_on = String(ctx.options.to);
    if (ctx.options.time !== undefined) data.time = parseInt(String(ctx.options.time));
    if (ctx.options['total-time'] !== undefined)
      data.total_time = parseInt(String(ctx.options['total-time']));
    if (ctx.options.percentage !== undefined)
      data.percentage = parseInt(String(ctx.options.percentage));
    if (ctx.options.tentative !== undefined) data.draft = ctx.options.tentative === true;
    if (ctx.options.confirm !== undefined) data.draft = false;
    if (ctx.options.note !== undefined) data.note = String(ctx.options.note);

    if (Object.keys(data).length === 0) {
      spinner.fail();
      throw ValidationError.invalid('options', data, 'No updates specified.');
    }

    const response = await ctx.api.updateBooking(id, data);
    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', id: response.data.id });
    } else {
      ctx.formatter.success(`Booking ${id} updated`);
    }
  }, ctx.formatter);
}
