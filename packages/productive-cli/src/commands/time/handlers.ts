/**
 * Handler implementations for time command
 */

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
 * List time entries
 */
export async function timeList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching time entries...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    // Parse generic filters first
    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Date filtering with smart parsing
    if (ctx.options.date) {
      const range = parseDateRange(String(ctx.options.date));
      if (range) {
        filter.after = range.from;
        filter.before = range.to;
      }
    }
    // --from and --to override --date
    if (ctx.options.from) {
      const parsed = parseDate(String(ctx.options.from));
      if (parsed) filter.after = parsed;
    }
    if (ctx.options.to) {
      const parsed = parseDate(String(ctx.options.to));
      if (parsed) filter.before = parsed;
    }

    // Person filtering
    if (ctx.options.mine && ctx.config.userId) {
      filter.person_id = ctx.config.userId;
    } else if (ctx.options.person) {
      filter.person_id = String(ctx.options.person);
    }
    if (ctx.options.project) filter.project_id = String(ctx.options.project);

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getTimeEntries({
      page,
      perPage,
      filter,
      sort: ctx.getSort(),
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(response.data, formatTimeEntry, response.meta);

    if (format === 'csv' || format === 'table') {
      // For CSV/table, flatten the data for OutputFormatter
      const data = response.data.map((e) => ({
        id: e.id,
        date: e.attributes.date,
        hours: (e.attributes.time / 60).toFixed(2),
        note: e.attributes.note || '',
        person_id: e.relationships?.person?.data?.id || '',
        project_id: e.relationships?.project?.data?.id || '',
      }));
      ctx.formatter.output(data);
    } else {
      // Use renderer for json and human formats
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
    const response = await ctx.api.getTimeEntry(id);
    const entry = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatTimeEntry(entry);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      // Use detail renderer for human format
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

  // Validate required fields before making API call
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
    const date = String(ctx.options.date || new Date().toISOString().split('T')[0]);

    const response = await ctx.api.createTimeEntry({
      person_id: personId,
      service_id: String(ctx.options.service),
      date,
      time: parseInt(String(ctx.options.time)),
      note: String(ctx.options.note || ''),
    });

    spinner.succeed();

    const entry = response.data;
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
    const data: { time?: number; note?: string; date?: string } = {};
    if (ctx.options.time) data.time = parseInt(String(ctx.options.time));
    if (ctx.options.note) data.note = String(ctx.options.note);
    if (ctx.options.date) data.date = String(ctx.options.date);

    if (Object.keys(data).length === 0) {
      spinner.fail();
      throw ValidationError.invalid(
        'options',
        data,
        'No updates specified. Use --time, --note, or --date',
      );
    }

    const response = await ctx.api.updateTimeEntry(id, data);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', id: response.data.id });
    } else {
      ctx.formatter.success(`Time entry ${id} updated`);
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
    await ctx.api.deleteTimeEntry(id);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', deleted: id });
    } else {
      ctx.formatter.success(`Time entry ${id} deleted`);
    }
  }, ctx.formatter);
}
