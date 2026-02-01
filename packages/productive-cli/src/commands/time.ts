import { OutputFormatter } from '../output.js';
import { colors } from '../utils/colors.js';
import { parseDate, parseDateRange } from '../utils/date.js';
import { stripHtml, link } from '../utils/html.js';
import { timeEntriesUrl } from '../utils/productive-links.js';
import type { OutputFormat } from '../types.js';
import { handleError, exitWithValidationError, runCommand } from '../error-handler.js';
import { ValidationError, ConfigError } from '../errors.js';
import { createContext, type CommandContext, type CommandOptions } from '../context.js';
import { formatTimeEntry, formatListResponse } from '../formatters/index.js';

export function showTimeHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive time list')} - List time entries

${colors.bold('USAGE:')}
  productive time list [options]

${colors.bold('OPTIONS:')}
  --date <date>       Filter by date (single day or range shortcut)
  --from <date>       Filter entries after this date
  --to <date>         Filter entries before this date
  --mine              Filter by configured user ID (shortcut for --person)
  --person <id>       Filter by person ID
  --project <id>      Filter by project ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('DATE FORMATS:')}
  ISO format:         2024-01-15
  Keywords:           today, yesterday, tomorrow
  Relative:           "2 days ago", "1 week ago", "3 months ago"
  Ranges:             "this week", "last week", "this month", "last month"

${colors.bold('EXAMPLES:')}
  productive time list --date today
  productive time list --date yesterday --mine
  productive time list --date "last week"
  productive time list --date "this month" --project 123
  productive time list --from "3 days ago" --to today
  productive time list --from 2024-01-01 --to 2024-01-31
  productive time list --filter service_id=123,project_id=456
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive time get')} - Get time entry details

${colors.bold('USAGE:')}
  productive time get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Time entry ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive time get 12345
  productive time get 12345 --format json
`);
  } else if (subcommand === 'add') {
    console.log(`
${colors.bold('productive time add')} - Create a time entry

${colors.bold('USAGE:')}
  productive time add --service <id> --time <minutes> [options]

${colors.bold('OPTIONS:')}
  --service <id>      Service ID (required)
  --time <minutes>    Duration in minutes (required)
  --date <date>       Date (YYYY-MM-DD, default: today)
  --note <text>       Note/description
  --person <id>       Person ID (default: from config userId)
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive time add --service 123 --time 480 --note "Development work"
  productive time add --service 123 --time 120 --date 2024-01-15
  productive time add --service 123 --time 60 --person 456
`);
  } else if (subcommand === 'update') {
    console.log(`
${colors.bold('productive time update')} - Update a time entry

${colors.bold('USAGE:')}
  productive time update <id> [options]

${colors.bold('ARGUMENTS:')}
  <id>                Time entry ID (required)

${colors.bold('OPTIONS:')}
  --time <minutes>    New duration in minutes
  --date <date>       New date (YYYY-MM-DD)
  --note <text>       New note/description
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive time update 12345 --time 240
  productive time update 12345 --note "Updated description"
  productive time update 12345 --date 2024-01-16 --time 480
`);
  } else if (subcommand === 'delete' || subcommand === 'rm') {
    console.log(`
${colors.bold('productive time delete')} - Delete a time entry

${colors.bold('USAGE:')}
  productive time delete <id>

${colors.bold('ALIASES:')}
  productive time rm <id>

${colors.bold('ARGUMENTS:')}
  <id>                Time entry ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive time delete 12345
  productive time rm 12345 --format json
`);
  } else {
    console.log(`
${colors.bold('productive time')} - Manage time entries

${colors.bold('USAGE:')}
  productive time <subcommand> [options]

${colors.bold('ALIASES:')}
  productive t

${colors.bold('SUBCOMMANDS:')}
  list, ls            List time entries
  get <id>            Get time entry details
  add                 Create a new time entry
  update <id>         Update a time entry
  delete, rm <id>     Delete a time entry

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive time list --from 2024-01-01
  productive time add --service 123 --time 480
  productive time get 12345
  productive time delete 12345

Run ${colors.cyan('productive time <subcommand> --help')} for subcommand details.
`);
  }
}

export async function handleTimeCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  // Create context for commands that support it
  const ctx = createContext(options as CommandOptions);

  switch (subcommand) {
    case 'list':
    case 'ls':
      await timeListWithContext(ctx);
      break;
    case 'get':
      await timeGetWithContext(args, ctx);
      break;
    case 'add':
      await timeAddWithContext(ctx);
      break;
    case 'update':
      await timeUpdateWithContext(args, ctx);
      break;
    case 'delete':
    case 'rm':
      await timeDeleteWithContext(args, ctx);
      break;
    default:
      formatter.error(`Unknown time subcommand: ${subcommand}`);
      process.exit(1);
  }
}

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

// These use explicit dependency injection for better testability
// ============================================================================

/**
 * List time entries using context-based dependency injection.
 * This is the new recommended pattern for command implementations.
 */
async function timeListWithContext(ctx: CommandContext): Promise<void> {
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

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output(formatListResponse(response.data, formatTimeEntry, response.meta));
    } else if (format === 'csv' || format === 'table') {
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
      let totalMinutes = 0;
      response.data.forEach((entry) => {
        const hours = Math.floor(entry.attributes.time / 60);
        const minutes = entry.attributes.time % 60;
        const duration = colors.green(`${hours}h ${minutes.toString().padStart(2, '0')}m`);
        totalMinutes += entry.attributes.time;

        const dateUrl = timeEntriesUrl(entry.attributes.date);
        const dateDisplay = dateUrl
          ? link(colors.bold(entry.attributes.date), dateUrl)
          : colors.bold(entry.attributes.date);

        console.log(`${dateDisplay}  ${duration}  ${colors.dim(`#${entry.id}`)}`);
        if (entry.attributes.note) {
          const note = stripHtml(entry.attributes.note);
          if (note) {
            console.log(`  ${colors.dim(note)}`);
          }
        }
        console.log();
      });

      if (response.data.length > 0) {
        const totalHours = Math.floor(totalMinutes / 60);
        const totalMins = totalMinutes % 60;
        console.log(colors.bold(colors.cyan(`Total: ${totalHours}h ${totalMins.toString().padStart(2, '0')}m`)));
      }

      if (response.meta?.total) {
        const currentPage = response.meta.page || 1;
        const pageSize = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / pageSize);
        console.log(colors.dim(`Page ${currentPage}/${totalPages} (Total: ${response.meta.total} entries)`));
      }
    }
  }, ctx.formatter);
}

/**
 * Get a single time entry using context-based dependency injection.
 */
async function timeGetWithContext(args: string[], ctx: CommandContext): Promise<void> {
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

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output(formatTimeEntry(entry));
    } else {
      const hours = Math.floor(entry.attributes.time / 60);
      const minutes = entry.attributes.time % 60;
      console.log(colors.bold('Time Entry'));
      console.log(colors.dim('─'.repeat(50)));
      console.log(`${colors.cyan('ID:')}       ${entry.id}`);
      console.log(`${colors.cyan('Date:')}     ${entry.attributes.date}`);
      console.log(`${colors.cyan('Duration:')} ${colors.green(`${hours}h ${minutes.toString().padStart(2, '0')}m`)} ${colors.dim(`(${entry.attributes.time} minutes)`)}`);
      if (entry.attributes.note) {
        const note = stripHtml(entry.attributes.note);
        if (note) {
          console.log(`${colors.cyan('Note:')}     ${note}`);
        }
      }
    }
  }, ctx.formatter);
}

/**
 * Add a time entry using context-based dependency injection.
 */
async function timeAddWithContext(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating time entry...');
  spinner.start();

  // Validate required fields before making API call
  const personId = String(ctx.options.person || ctx.config.userId || '');
  if (!personId) {
    spinner.fail();
    handleError(
      new ConfigError('Person ID required. Specify --person or set userId in config', ['userId']),
      ctx.formatter
    );
    return;
  }

  if (!ctx.options.service) {
    spinner.fail();
    handleError(
      ValidationError.required('service'),
      ctx.formatter
    );
    return;
  }

  if (!ctx.options.time) {
    spinner.fail();
    handleError(
      ValidationError.required('time'),
      ctx.formatter
    );
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
 * Update a time entry using context-based dependency injection.
 */
async function timeUpdateWithContext(args: string[], ctx: CommandContext): Promise<void> {
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
      throw ValidationError.invalid('options', data, 'No updates specified. Use --time, --note, or --date');
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
 * Delete a time entry using context-based dependency injection.
 */
async function timeDeleteWithContext(args: string[], ctx: CommandContext): Promise<void> {
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

// ============================================================================
// Legacy implementations (kept for reference during migration)
// These can be removed once all commands use the new pattern
// ============================================================================

// The old timeList, timeGet, timeAdd, timeUpdate, timeDelete functions
// are kept above for backward compatibility but are no longer called
