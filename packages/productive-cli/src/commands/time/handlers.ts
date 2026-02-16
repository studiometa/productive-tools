/**
 * CLI adapter for time command handlers.
 *
 * These are thin wrappers that:
 * 1. Parse CLI options into typed executor options
 * 2. Manage spinners
 * 3. Call executors for business logic
 * 4. Format and render output
 *
 * All business logic lives in @studiometa/productive-core executors.
 */

import {
  fromCommandContext,
  listTimeEntries,
  getTimeEntry,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  ExecutorValidationError,
  type ListTimeEntriesOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError, ConfigError } from '../../errors.js';
import { formatTimeEntry, formatListResponse } from '../../formatters/index.js';
import {
  render,
  createRenderContext,
  humanTimeEntryDetailRenderer,
} from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';
import { parseDate, parseDateRange } from '../../utils/date.js';

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
 * Parse CLI options into ListTimeEntriesOptions.
 * Handles date parsing, --mine flag, and generic filter strings.
 */
function parseListOptions(ctx: CommandContext): ListTimeEntriesOptions {
  const options: ListTimeEntriesOptions = {};

  // Parse generic filters
  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter) {
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  }
  if (Object.keys(additionalFilters).length > 0) {
    options.additionalFilters = additionalFilters;
  }

  // Date filtering with smart parsing
  if (ctx.options.date) {
    const range = parseDateRange(String(ctx.options.date));
    if (range) {
      options.after = range.from;
      options.before = range.to;
    }
  }
  // --from and --to override --date
  if (ctx.options.from) {
    const parsed = parseDate(String(ctx.options.from));
    if (parsed) options.after = parsed;
  }
  if (ctx.options.to) {
    const parsed = parseDate(String(ctx.options.to));
    if (parsed) options.before = parsed;
  }

  // Person filtering
  if (ctx.options.mine && ctx.config.userId) {
    options.personId = ctx.config.userId;
  } else if (ctx.options.person) {
    options.personId = String(ctx.options.person);
  }

  // Resource filtering
  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.service) options.serviceId = String(ctx.options.service);
  if (ctx.options.task) options.taskId = String(ctx.options.task);
  if (ctx.options.company) options.companyId = String(ctx.options.company);
  if (ctx.options.deal) options.dealId = String(ctx.options.deal);
  if (ctx.options.budget) options.budgetId = String(ctx.options.budget);

  // Enum filters
  if (ctx.options.status) options.status = String(ctx.options.status);
  if (ctx.options['billing-type']) options.billingType = String(ctx.options['billing-type']);
  if (ctx.options['invoicing-status'])
    options.invoicingStatus = String(ctx.options['invoicing-status']);

  // Pagination
  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort();

  return options;
}

/**
 * List time entries
 */
export async function timeList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching time entries...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const options = parseListOptions(ctx);
    const result = await listTimeEntries(options, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatTimeEntry, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((e) => ({
        id: e.id,
        date: e.attributes.date,
        hours: (e.attributes.time / 60).toFixed(2),
        note: e.attributes.note || '',
        person_id: e.relationships?.person?.data?.id || '',
        project_id: e.relationships?.project?.data?.id || '',
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      render('time_entry', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single time entry by ID
 */
export async function timeGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive time get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching time entry...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getTimeEntry({ id }, execCtx);
    const entry = result.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatTimeEntry(entry);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      humanTimeEntryDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Add a new time entry
 */
export async function timeAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating time entry...');
  spinner.start();

  // Validate required fields before making API call (CLI-specific validation with error formatting)
  const personId = String(ctx.options.person || ctx.config.userId || '');
  if (!personId) {
    spinner.fail();
    handleError(
      new ConfigError('Person ID required. Specify --person or set userId in config', ['userId']),
      ctx.formatter,
    );
    return;
  }

  if (!ctx.options.service) {
    spinner.fail();
    handleError(ValidationError.required('service'), ctx.formatter);
    return;
  }

  if (!ctx.options.time) {
    spinner.fail();
    handleError(ValidationError.required('time'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await createTimeEntry(
      {
        personId,
        serviceId: String(ctx.options.service),
        time: parseInt(String(ctx.options.time)),
        date: ctx.options.date ? String(ctx.options.date) : undefined,
        note: ctx.options.note ? String(ctx.options.note) : undefined,
      },
      execCtx,
    );

    spinner.succeed();

    const entry = result.data;
    const hours = Math.floor(entry.attributes.time / 60);
    const minutes = entry.attributes.time % 60;

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({
        status: 'success',
        ...formatTimeEntry(entry),
      });
    } else {
      ctx.formatter.success('Time entry created');
      console.log(colors.cyan('ID:'), entry.id);
      console.log(colors.cyan('Date:'), entry.attributes.date);
      console.log(colors.cyan('Duration:'), `${hours}h ${minutes}m`);
      if (entry.attributes.note) {
        console.log(colors.cyan('Note:'), entry.attributes.note);
      }
    }
  }, ctx.formatter);
}

/**
 * Update an existing time entry
 */
export async function timeUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive time update <id> [options]', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Updating time entry...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    try {
      const result = await updateTimeEntry(
        {
          id,
          time: ctx.options.time ? parseInt(String(ctx.options.time)) : undefined,
          note: ctx.options.note ? String(ctx.options.note) : undefined,
          date: ctx.options.date ? String(ctx.options.date) : undefined,
        },
        execCtx,
      );

      spinner.succeed();

      const format = ctx.options.format || ctx.options.f || 'human';
      if (format === 'json') {
        ctx.formatter.output({ status: 'success', id: result.data.id });
      } else {
        ctx.formatter.success(`Time entry ${id} updated`);
      }
    } catch (error) {
      if (error instanceof ExecutorValidationError) {
        spinner.fail();
        throw ValidationError.invalid(
          'options',
          {},
          'No updates specified. Use --time, --note, or --date',
        );
      }
      throw error;
    }
  }, ctx.formatter);
}

/**
 * Delete a time entry
 */
export async function timeDelete(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive time delete <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Deleting time entry...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    await deleteTimeEntry({ id }, execCtx);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', deleted: id });
    } else {
      ctx.formatter.success(`Time entry ${id} deleted`);
    }
  }, ctx.formatter);
}
