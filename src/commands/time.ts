import { ProductiveApi, ProductiveApiError } from '../api.js';
import { OutputFormatter, createSpinner } from '../output.js';
import { getConfig } from '../config.js';
import { colors } from '../utils/colors.js';
import { parseDate, parseDateRange } from '../utils/date.js';
import type { OutputFormat } from '../types.js';

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

  switch (subcommand) {
    case 'list':
    case 'ls':
      await timeList(options, formatter);
      break;
    case 'get':
      await timeGet(args, options, formatter);
      break;
    case 'add':
      await timeAdd(options, formatter);
      break;
    case 'update':
      await timeUpdate(args, options, formatter);
      break;
    case 'delete':
    case 'rm':
      await timeDelete(args, options, formatter);
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

async function timeList(
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const spinner = createSpinner('Fetching time entries...', formatter['format']);
  spinner.start();

  try {
    const config = getConfig();
    const api = new ProductiveApi(options);
    const filter: Record<string, string> = {};

    // Parse generic filters first
    if (options.filter) {
      Object.assign(filter, parseFilters(String(options.filter)));
    }

    // Date filtering with smart parsing
    if (options.date) {
      const range = parseDateRange(String(options.date));
      if (range) {
        filter.after = range.from;
        filter.before = range.to;
      }
    }
    // --from and --to override --date
    if (options.from) {
      const parsed = parseDate(String(options.from));
      if (parsed) filter.after = parsed;
    }
    if (options.to) {
      const parsed = parseDate(String(options.to));
      if (parsed) filter.before = parsed;
    }

    // Person filtering
    if (options.mine && config.userId) {
      filter.person_id = config.userId;
    } else if (options.person) {
      filter.person_id = String(options.person);
    }
    if (options.project) filter.project_id = String(options.project);

    const response = await api.getTimeEntries({
      page: parseInt(String(options.page || options.p || '1')),
      perPage: parseInt(String(options.size || options.s || '100')),
      filter,
      sort: String(options.sort || ''),
    });

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({
        data: response.data.map((e) => ({
          id: e.id,
          date: e.attributes.date,
          time_minutes: e.attributes.time,
          time_hours: (e.attributes.time / 60).toFixed(2),
          note: e.attributes.note,
          person_id: e.relationships?.person?.data?.id,
          service_id: e.relationships?.service?.data?.id,
          project_id: e.relationships?.project?.data?.id,
          created_at: e.attributes.created_at,
          updated_at: e.attributes.updated_at,
        })),
        meta: response.meta,
      });
    } else if (formatter['format'] === 'csv' || formatter['format'] === 'table') {
      const data = response.data.map((e) => ({
        id: e.id,
        date: e.attributes.date,
        hours: (e.attributes.time / 60).toFixed(2),
        note: e.attributes.note || '',
        person_id: e.relationships?.person?.data?.id || '',
        project_id: e.relationships?.project?.data?.id || '',
      }));
      formatter.output(data);
    } else {
      let totalMinutes = 0;
      response.data.forEach((entry) => {
        const hours = Math.floor(entry.attributes.time / 60);
        const minutes = entry.attributes.time % 60;
        const duration = `${hours}h ${minutes}m`;
        totalMinutes += entry.attributes.time;

        console.log(colors.bold(`${entry.attributes.date} - ${duration}`));
        console.log(colors.dim(`  ID: ${entry.id}`));
        if (entry.attributes.note) {
          console.log(colors.dim(`  Note: ${entry.attributes.note}`));
        }
        console.log();
      });

      if (response.data.length > 0) {
        const totalHours = Math.floor(totalMinutes / 60);
        const totalMins = totalMinutes % 60;
        console.log(colors.cyan(`Total: ${totalHours}h ${totalMins}m`));
      }

      if (response.meta?.total) {
        const currentPage = response.meta.page || 1;
        const perPage = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / perPage);
        console.log(colors.dim(`Page ${currentPage}/${totalPages} (Total: ${response.meta.total} entries)`));
      }
    }
  } catch (error) {
    spinner.fail();
    handleError(error, formatter);
  }
}

async function timeGet(
  args: string[],
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const [id] = args;

  if (!id) {
    formatter.error('Usage: productive time get <id>');
    process.exit(1);
  }

  const spinner = createSpinner('Fetching time entry...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi(options);
    const response = await api.getTimeEntry(id);
    const entry = response.data;

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({
        id: entry.id,
        date: entry.attributes.date,
        time_minutes: entry.attributes.time,
        time_hours: (entry.attributes.time / 60).toFixed(2),
        note: entry.attributes.note,
        person_id: entry.relationships?.person?.data?.id,
        service_id: entry.relationships?.service?.data?.id,
        project_id: entry.relationships?.project?.data?.id,
        created_at: entry.attributes.created_at,
        updated_at: entry.attributes.updated_at,
      });
    } else {
      const hours = Math.floor(entry.attributes.time / 60);
      const minutes = entry.attributes.time % 60;
      console.log(colors.bold('Time Entry'));
      console.log(colors.dim('─'.repeat(50)));
      console.log(colors.cyan('ID:'), entry.id);
      console.log(colors.cyan('Date:'), entry.attributes.date);
      console.log(colors.cyan('Duration:'), `${hours}h ${minutes}m (${entry.attributes.time} minutes)`);
      if (entry.attributes.note) {
        console.log(colors.cyan('Note:'), entry.attributes.note);
      }
    }
  } catch (error) {
    spinner.fail();
    handleError(error, formatter);
  }
}

async function timeAdd(
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const spinner = createSpinner('Creating time entry...', formatter['format']);
  spinner.start();

  try {
    const config = getConfig();
    const personId = String(options.person || config.userId || '');

    if (!personId) {
      spinner.fail();
      formatter.error('Person ID required. Specify --person or set userId in config');
      process.exit(1);
    }

    if (!options.service) {
      spinner.fail();
      formatter.error('Service ID required. Specify --service');
      process.exit(1);
    }

    if (!options.time) {
      spinner.fail();
      formatter.error('Time required. Specify --time <minutes>');
      process.exit(1);
    }

    const date = String(options.date || new Date().toISOString().split('T')[0]);

    const api = new ProductiveApi(options);
    const response = await api.createTimeEntry({
      person_id: personId,
      service_id: String(options.service),
      date,
      time: parseInt(String(options.time)),
      note: String(options.note || ''),
    });

    spinner.succeed();

    const entry = response.data;
    const hours = Math.floor(entry.attributes.time / 60);
    const minutes = entry.attributes.time % 60;

    if (formatter['format'] === 'json') {
      formatter.output({
        status: 'success',
        id: entry.id,
        date: entry.attributes.date,
        time_minutes: entry.attributes.time,
        time_hours: (entry.attributes.time / 60).toFixed(2),
        note: entry.attributes.note,
      });
    } else {
      formatter.success('Time entry created');
      console.log(colors.cyan('ID:'), entry.id);
      console.log(colors.cyan('Date:'), entry.attributes.date);
      console.log(colors.cyan('Duration:'), `${hours}h ${minutes}m`);
      if (entry.attributes.note) {
        console.log(colors.cyan('Note:'), entry.attributes.note);
      }
    }
  } catch (error) {
    spinner.fail();
    handleError(error, formatter);
  }
}

async function timeUpdate(
  args: string[],
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const [id] = args;

  if (!id) {
    formatter.error('Usage: productive time update <id> [options]');
    process.exit(1);
  }

  const spinner = createSpinner('Updating time entry...', formatter['format']);
  spinner.start();

  try {
    const data: { time?: number; note?: string; date?: string } = {};
    if (options.time) data.time = parseInt(String(options.time));
    if (options.note) data.note = String(options.note);
    if (options.date) data.date = String(options.date);

    if (Object.keys(data).length === 0) {
      spinner.fail();
      formatter.error('No updates specified. Use --time, --note, or --date');
      process.exit(1);
    }

    const api = new ProductiveApi(options);
    const response = await api.updateTimeEntry(id, data);

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({ status: 'success', id: response.data.id });
    } else {
      formatter.success(`Time entry ${id} updated`);
    }
  } catch (error) {
    spinner.fail();
    handleError(error, formatter);
  }
}

async function timeDelete(
  args: string[],
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const [id] = args;

  if (!id) {
    formatter.error('Usage: productive time delete <id>');
    process.exit(1);
  }

  const spinner = createSpinner('Deleting time entry...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi(options);
    await api.deleteTimeEntry(id);

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({ status: 'success', deleted: id });
    } else {
      formatter.success(`Time entry ${id} deleted`);
    }
  } catch (error) {
    spinner.fail();
    handleError(error, formatter);
  }
}

function handleError(error: unknown, formatter: OutputFormatter): void {
  if (error instanceof ProductiveApiError) {
    if (formatter['format'] === 'json') {
      formatter.output(error.toJSON());
    } else {
      formatter.error(error.message);
    }
  } else {
    formatter.error('An unexpected error occurred', error);
  }
  process.exit(1);
}
