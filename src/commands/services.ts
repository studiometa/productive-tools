import { ProductiveApi, ProductiveApiError } from '../api.js';
import { OutputFormatter, createSpinner } from '../output.js';
import { colors } from '../utils/colors.js';
import type { OutputFormat } from '../types.js';

export function showServicesHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive services list')} - List services

${colors.bold('USAGE:')}
  productive services list [options]

${colors.bold('OPTIONS:')}
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive services list
  productive services list --format json
  productive services list -p 2 -s 50
`);
  } else {
    console.log(`
${colors.bold('productive services')} - Manage services

${colors.bold('USAGE:')}
  productive services <subcommand> [options]

${colors.bold('ALIASES:')}
  productive svc

${colors.bold('SUBCOMMANDS:')}
  list, ls            List services

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive services list
  productive svc list --format json

Run ${colors.cyan('productive services list --help')} for subcommand details.
`);
  }
}

export async function handleServicesCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  switch (subcommand) {
    case 'list':
    case 'ls':
      await servicesList(options, formatter);
      break;
    default:
      formatter.error(`Unknown services subcommand: ${subcommand}`);
      process.exit(1);
  }
}

async function servicesList(
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const spinner = createSpinner('Fetching services...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi(options);
    const response = await api.getServices({
      page: parseInt(String(options.page || options.p || '1')),
      perPage: parseInt(String(options.size || options.s || '100')),
    });

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({
        data: response.data.map((s) => ({
          id: s.id,
          name: s.attributes.name,
          created_at: s.attributes.created_at,
          updated_at: s.attributes.updated_at,
        })),
        meta: response.meta,
      });
    } else if (formatter['format'] === 'csv' || formatter['format'] === 'table') {
      const data = response.data.map((s) => ({
        id: s.id,
        name: s.attributes.name,
      }));
      formatter.output(data);
    } else {
      response.data.forEach((service) => {
        console.log(colors.bold(service.attributes.name));
        console.log(colors.dim(`  ID: ${service.id}`));
        console.log();
      });

      if (response.meta?.total) {
        const currentPage = response.meta.page || 1;
        const perPage = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / perPage);
        console.log(colors.dim(`Page ${currentPage}/${totalPages} (Total: ${response.meta.total} services)`));
      }
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
