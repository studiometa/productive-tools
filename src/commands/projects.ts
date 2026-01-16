import { ProductiveApi, ProductiveApiError } from '../api.js';
import { OutputFormatter, createSpinner } from '../output.js';
import { colors } from '../utils/colors.js';
import type { OutputFormat } from '../types.js';

export async function handleProjectsCommand(
  subcommand: string,
  args: string[],
  options: Record<string, string | boolean>
): Promise<void> {
  const format = (options.format || options.f || 'human') as OutputFormat;
  const formatter = new OutputFormatter(format, options['no-color'] === true);

  switch (subcommand) {
    case 'list':
    case 'ls':
      await projectsList(options, formatter);
      break;
    case 'get':
      await projectsGet(args, options, formatter);
      break;
    default:
      formatter.error(`Unknown projects subcommand: ${subcommand}`);
      process.exit(1);
  }
}

async function projectsList(
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const spinner = createSpinner('Fetching projects...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi();
    const filter: Record<string, string> = {};

    // Note: The Productive API doesn't support 'archived' filter on projects endpoint
    // To filter archived projects, use --archived flag which removes the default filter

    const response = await api.getProjects({
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
          name: p.attributes.name,
          project_number: p.attributes.project_number,
          archived: p.attributes.archived,
          budget: p.attributes.budget,
          created_at: p.attributes.created_at,
          updated_at: p.attributes.updated_at,
        })),
        meta: response.meta,
      });
    } else if (formatter['format'] === 'csv' || formatter['format'] === 'table') {
      const data = response.data.map((p) => ({
        id: p.id,
        name: p.attributes.name,
        number: p.attributes.project_number || '',
        archived: p.attributes.archived ? 'yes' : 'no',
        budget: p.attributes.budget || '',
        created: p.attributes.created_at.split('T')[0],
      }));
      formatter.output(data);
    } else {
      response.data.forEach((project) => {
        const status = project.attributes.archived
          ? colors.gray('[archived]')
          : colors.green('[active]');

        console.log(colors.bold(project.attributes.name), status);
        console.log(colors.dim(`  ID: ${project.id}`));
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
        const perPage = response.meta.per_page || 100;
        const totalPages = Math.ceil(response.meta.total / perPage);
        console.log(colors.dim(`Page ${currentPage}/${totalPages} (Total: ${response.meta.total})`));
      }
    }
  } catch (error) {
    spinner.fail();
    handleError(error, formatter);
  }
}

async function projectsGet(
  args: string[],
  options: Record<string, string | boolean>,
  formatter: OutputFormatter
): Promise<void> {
  const [id] = args;

  if (!id) {
    formatter.error('Usage: productive projects get <id>');
    process.exit(1);
  }

  const spinner = createSpinner('Fetching project...', formatter['format']);
  spinner.start();

  try {
    const api = new ProductiveApi();
    const response = await api.getProject(id);
    const project = response.data;

    spinner.succeed();

    if (formatter['format'] === 'json') {
      formatter.output({
        id: project.id,
        name: project.attributes.name,
        project_number: project.attributes.project_number,
        archived: project.attributes.archived,
        budget: project.attributes.budget,
        created_at: project.attributes.created_at,
        updated_at: project.attributes.updated_at,
        relationships: project.relationships,
      });
    } else {
      console.log(colors.bold(colors.cyan(project.attributes.name)));
      console.log(colors.dim('─'.repeat(50)));
      console.log(colors.cyan('ID:'), project.id);
      if (project.attributes.project_number) {
        console.log(colors.cyan('Number:'), project.attributes.project_number);
      }
      console.log(
        colors.cyan('Status:'),
        project.attributes.archived ? colors.gray('Archived') : colors.green('Active')
      );
      if (project.attributes.budget) {
        console.log(colors.cyan('Budget:'), project.attributes.budget);
      }
      console.log(colors.cyan('Created:'), new Date(project.attributes.created_at).toLocaleString());
      console.log(colors.cyan('Updated:'), new Date(project.attributes.updated_at).toLocaleString());
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
