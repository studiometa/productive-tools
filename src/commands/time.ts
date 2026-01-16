import { ProductiveApi, ProductiveApiError } from '../api.js';
import { OutputFormatter, createSpinner } from '../output.js';
import { getConfig } from '../config.js';
import { colors } from '../utils/colors.js';
import type { OutputFormat } from '../types.js';

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

async function timeList(
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const spinner = createSpinner('Fetching time entries...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi(options);
    const filter: Record<string, string> = {};

    if (options.from) filter.after = String(options.from);
    if (options.to) filter.before = String(options.to);
    if (options.person) filter.person_id = String(options.person);
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
