import { OutputFormatter } from '../output.js';
import { colors } from '../utils/colors.js';
import { linkedId } from '../utils/productive-links.js';
import type { OutputFormat } from '../types.js';
import { exitWithValidationError, runCommand } from '../error-handler.js';
import { createContext, type CommandContext, type CommandOptions } from '../context.js';
import { formatProject, formatListResponse } from '../formatters/index.js';

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

export function showProjectsHelp(subcommand?: string): void {
  if (subcommand === 'list' || subcommand === 'ls') {
    console.log(`
${colors.bold('productive projects list')} - List projects

${colors.bold('USAGE:')}
  productive projects list [options]

${colors.bold('OPTIONS:')}
  --company <id>      Filter by company ID
  --filter <filters>  Generic filters (comma-separated key=value pairs)
  -p, --page <num>    Page number (default: 1)
  -s, --size <num>    Page size (default: 100)
  --sort <field>      Sort by field (prefix with - for descending)
  -f, --format <fmt>  Output format: json, human, csv, table

${colors.bold('EXAMPLES:')}
  productive projects list
  productive projects list --company 12345
  productive projects list --filter archived=false
  productive projects list --format json
  productive projects list --sort -created_at
`);
  } else if (subcommand === 'get') {
    console.log(`
${colors.bold('productive projects get')} - Get project details

${colors.bold('USAGE:')}
  productive projects get <id>

${colors.bold('ARGUMENTS:')}
  <id>                Project ID (required)

${colors.bold('OPTIONS:')}
  -f, --format <fmt>  Output format: json, human

${colors.bold('EXAMPLES:')}
  productive projects get 12345
  productive projects get 12345 --format json
`);
  } else {
    console.log(`
${colors.bold('productive projects')} - Manage projects

${colors.bold('USAGE:')}
  productive projects <subcommand> [options]

${colors.bold('ALIASES:')}
  productive p

${colors.bold('SUBCOMMANDS:')}
  list, ls            List projects
  get <id>            Get project details

${colors.bold('COMMON OPTIONS:')}
  -f, --format <fmt>  Output format: json, human, csv, table
  -p, --page <num>    Page number for pagination
  -s, --size <num>    Page size (default: 100)
  -h, --help          Show help for a subcommand

${colors.bold('EXAMPLES:')}
  productive projects list
  productive projects get 12345

Run ${colors.cyan('productive projects <subcommand> --help')} for subcommand details.
`);
  }
}

export async function handleProjectsCommand(
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
      await projectsListWithContext(ctx);
      break;
    case 'get':
      await projectsGetWithContext(args, ctx);
      break;
    default:
      formatter.error(`Unknown projects subcommand: ${subcommand}`);
      process.exit(1);
  }
}


/**
 * List projects using context-based dependency injection.
 */
async function projectsListWithContext(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching projects...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    // Parse generic filters first
    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Specific filter options (override generic filters)
    if (ctx.options.company) {
      filter.company_id = String(ctx.options.company);
    }

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getProjects({
      page,
      perPage,
      filter,
      sort: ctx.getSort(),
    });

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output(formatListResponse(response.data, formatProject, response.meta));
    } else if (format === 'csv' || format === 'table') {
      const data = response.data.map((p) => ({
        id: p.id,
        name: p.attributes.name,
        number: p.attributes.project_number || '',
        archived: p.attributes.archived ? 'yes' : 'no',
        budget: p.attributes.budget || '',
        created: p.attributes.created_at.split('T')[0],
      }));
      ctx.formatter.output(data);
    } else {
      response.data.forEach((project) => {
        const status = project.attributes.archived
          ? colors.gray('[archived]')
          : colors.green('[active]');

        console.log(`${colors.bold(project.attributes.name)} ${status} ${linkedId(project.id, 'project')}`);
        if (project.attributes.project_number) {
          console.log(colors.dim(`  Number: ${project.attributes.project_number}`));
        }
        if (project.attributes.budget) {
          console.log(colors.dim(`  Budget: ${project.attributes.budget}`));
        }
        console.log();
      });

      if (response.meta?.total) {
        const currentPage = response.meta.page || 1;
        const pageSize = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / pageSize);
        console.log(colors.dim(`Page ${currentPage}/${totalPages} (Total: ${response.meta.total})`));
      }
    }
  }, ctx.formatter);
}

/**
 * Get a single project using context-based dependency injection.
 */
async function projectsGetWithContext(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive projects get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching project...');
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getProject(id);
    const project = response.data;

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output(formatProject(project));
    } else {
      console.log(colors.bold(colors.cyan(project.attributes.name)));
      console.log(colors.dim('─'.repeat(50)));
      console.log(`${colors.cyan('ID:')}      ${linkedId(project.id, 'project')}`);
      if (project.attributes.project_number) {
        console.log(`${colors.cyan('Number:')}  ${project.attributes.project_number}`);
      }
      console.log(
        `${colors.cyan('Status:')}  ${project.attributes.archived ? colors.gray('Archived') : colors.green('Active')}`
      );
      if (project.attributes.budget) {
        console.log(`${colors.cyan('Budget:')}  ${project.attributes.budget}`);
      }
      console.log(`${colors.cyan('Created:')} ${new Date(project.attributes.created_at).toLocaleString()}`);
      console.log(`${colors.cyan('Updated:')} ${new Date(project.attributes.updated_at).toLocaleString()}`);
    }
  }, ctx.formatter);
}

// ============================================================================
// Legacy implementations (kept for reference during migration)
// ============================================================================

// The old projectsList, projectsGet functions are kept above for
// backward compatibility but are no longer called
