import { ProductiveApi, ProductiveApiError } from '../api.js';
import { OutputFormatter, createSpinner } from '../output.js';
import { colors } from '../utils/colors.js';
import type { OutputFormat } from '../types.js';

export function showPeopleHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive people list')} - List people

${colors.bold('USAGE:')}
  productive people list [options]

${colors.bold('OPTIONS:')}
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive people list
  productive people list --format json
  productive people list -p 2 -s 50
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

  switch (subcommand) {
    case 'list':
    case 'ls':
      await peopleList(options, formatter);
      break;
    case 'get':
      await peopleGet(args, options, formatter);
      break;
    default:
      formatter.error(`Unknown people subcommand: ${subcommand}`);
      process.exit(1);
  }
}

async function peopleList(
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const spinner = createSpinner('Fetching people...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi(options);
    const filter: Record<string, string> = {};

    // Note: The Productive API doesn't support 'active' filter on people endpoint
    // All people are returned by default

    const response = await api.getPeople({
      page: parseInt(String(options.page || options.p || '1')),
      perPage: parseInt(String(options.size || options.s || '100')),
      filter,
      sort: String(options.sort || ''),
    });

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({
        data: response.data.map((p) => ({
          id: p.id,
          first_name: p.attributes.first_name,
          last_name: p.attributes.last_name,
          email: p.attributes.email,
          active: p.attributes.active,
          created_at: p.attributes.created_at,
          updated_at: p.attributes.updated_at,
        })),
        meta: response.meta,
      });
    } else if (formatter['format'] === 'csv' || formatter['format'] === 'table') {
      const data = response.data.map((p) => ({
        id: p.id,
        first_name: p.attributes.first_name,
        last_name: p.attributes.last_name,
        email: p.attributes.email,
        active: p.attributes.active ? 'yes' : 'no',
      }));
      formatter.output(data);
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
  } catch (error) {
    spinner.fail();
    handleError(error, formatter);
  }
}

async function peopleGet(
  args: string[],
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const [id] = args;

  if (!id) {
    formatter.error('Usage: productive people get <id>');
    process.exit(1);
  }

  const spinner = createSpinner('Fetching person...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi(options);
    const response = await api.getPerson(id);
    const person = response.data;

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({
        id: person.id,
        first_name: person.attributes.first_name,
        last_name: person.attributes.last_name,
        email: person.attributes.email,
        active: person.attributes.active,
        created_at: person.attributes.created_at,
        updated_at: person.attributes.updated_at,
        relationships: person.relationships,
      });
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
