import { OutputFormatter } from '../output.js';
import { colors } from '../utils/colors.js';
import { linkedId } from '../utils/productive-links.js';
import type { OutputFormat } from '../types.js';
import { runCommand } from '../error-handler.js';
import { createContext, type CommandContext, type CommandOptions } from '../context.js';
import { formatService, formatListResponse } from '../formatters/index.js';

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

export function showServicesHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive services list')} - List services

${colors.bold('USAGE:')}
  productive services list [options]

${colors.bold('OPTIONS:')}
  --project <id>      Filter by project ID
  --deal <id>         Filter by deal ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive services list
  productive services list --project 12345
  productive services list --filter deal_id=67890
  productive services list --format json -p 2 -s 50
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

  const ctx = createContext(options as CommandOptions);

  switch (subcommand) {
    case 'list':
    case 'ls':
      await servicesListWithContext(ctx);
      break;
    default:
      formatter.error(`Unknown services subcommand: ${subcommand}`);
      process.exit(1);
  }
}

// ============================================================================
// Context-based command implementations (new pattern)
// ============================================================================

async function servicesListWithContext(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching services...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    if (ctx.options.project) {
      filter.project_id = String(ctx.options.project);
    }
    if (ctx.options.deal) {
      filter.deal_id = String(ctx.options.deal);
    }

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getServices({
      page,
      perPage,
      filter,
    });

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output(formatListResponse(response.data, formatService, response.meta));
    } else if (format === 'csv' || format === 'table') {
      const data = response.data.map((s) => ({
        id: s.id,
        name: s.attributes.name,
      }));
      ctx.formatter.output(data);
    } else {
      response.data.forEach((service) => {
        console.log(`${colors.bold(service.attributes.name)} ${linkedId(service.id, 'service')}`);
        console.log();
      });

      if (response.meta?.total) {
        const currentPage = response.meta.page || 1;
        const perPage = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / perPage);
        console.log(colors.dim(`Page ${currentPage}/${totalPages} (Total: ${response.meta.total} services)`));
      }
    }
  }, ctx.formatter);
}
