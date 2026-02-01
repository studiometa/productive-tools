import { OutputFormatter } from '../output.js';
import { colors } from '../utils/colors.js';
import type { OutputFormat } from '../types.js';
import { exitWithValidationError, runCommand } from '../error-handler.js';
import { createContext, type CommandContext, type CommandOptions } from '../context.js';
import { formatPerson, formatListResponse } from '../formatters/index.js';

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

export function showPeopleHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive people list')} - List people

${colors.bold('USAGE:')}
  productive people list [options]

${colors.bold('OPTIONS:')}
  --company <id>      Filter by company ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive people list
  productive people list --company 12345
  productive people list --filter active=true
  productive people list --format json -p 2 -s 50
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive people get')} - Get person details

${colors.bold('USAGE:')}
  productive people get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Person ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive people get 12345
  productive people get 12345 --format json
`);
  } else {
    console.log(`
${colors.bold('productive people')} - Manage people

${colors.bold('USAGE:')}
  productive people <subcommand> [options]

${colors.bold('SUBCOMMANDS:')}
  list, ls            List people
  get <id>            Get person details

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive people list
  productive people get 12345

Run ${colors.cyan('productive people <subcommand> --help')} for subcommand details.
`);
  }
}

export async function handlePeopleCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  const ctx = createContext(options as CommandOptions);

  switch (subcommand) {
    case 'list':
    case 'ls':
      await peopleListWithContext(ctx);
      break;
    case 'get':
      await peopleGetWithContext(args, ctx);
      break;
    default:
      formatter.error(`Unknown people subcommand: ${subcommand}`);
      process.exit(1);
  }
}

// ============================================================================
// Context-based command implementations (new pattern)
// ============================================================================

async function peopleListWithContext(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching people...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.company) {
      filter.company_id = String(ctx.options.company);
    }

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getPeople({
      page,
      perPage,
      filter,
      sort: ctx.getSort(),
    });

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output(formatListResponse(response.data, formatPerson, response.meta));
    } else if (format === 'csv' || format === 'table') {
      const data = response.data.map((p) => ({
        id: p.id,
        first_name: p.attributes.first_name,
        last_name: p.attributes.last_name,
        email: p.attributes.email,
        active: p.attributes.active ? 'yes' : 'no',
      }));
      ctx.formatter.output(data);
    } else {
      response.data.forEach((person) => {
        const status = person.attributes.active ? colors.green('[active]') : colors.gray('[inactive]');
        const name = `${person.attributes.first_name} ${person.attributes.last_name}`;
        console.log(`${colors.bold(name)} ${status}`);
        console.log(colors.dim(`  ID: ${person.id}`));
        console.log(colors.dim(`  Email: ${person.attributes.email}`));
        console.log();
      });

      if (response.meta?.total) {
        const currentPage = response.meta.page || 1;
        const perPage = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / perPage);
        console.log(colors.dim(`Page ${currentPage}/${totalPages} (Total: ${response.meta.total} people)`));
      }
    }
  }, ctx.formatter);
}

async function peopleGetWithContext(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive people get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching person...');
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getPerson(id);
    const person = response.data;

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output(formatPerson(person));
    } else {
      const name = `${person.attributes.first_name} ${person.attributes.last_name}`;
      console.log(colors.bold(colors.cyan(name)));
      console.log(colors.dim('─'.repeat(50)));
      console.log(colors.cyan('ID:'), person.id);
      console.log(colors.cyan('Email:'), person.attributes.email);
      console.log(
        colors.cyan('Status:'),
        person.attributes.active ? colors.green('Active') : colors.gray('Inactive')
      );
      console.log(colors.cyan('Created:'), new Date(person.attributes.created_at).toLocaleString());
      console.log(colors.cyan('Updated:'), new Date(person.attributes.updated_at).toLocaleString());
    }
  }, ctx.formatter);
}
