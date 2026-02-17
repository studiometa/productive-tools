/**
 * CLI adapter for projects command handlers.
 */

import { formatProject, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  listProjects,
  getProject,
  type ListProjectsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { exitWithValidationError, runCommand } from '../../error-handler.js';
import { render, createRenderContext, humanProjectDetailRenderer } from '../../renderers/index.js';
import { parseFilters } from '../../utils/parse-filters.js';

/**
 * Parse CLI options into ListProjectsOptions.
 */
function parseListOptions(ctx: CommandContext): ListProjectsOptions {
  const options: ListProjectsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter) {
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  }
  if (Object.keys(additionalFilters).length > 0) {
    options.additionalFilters = additionalFilters;
  }

  if (ctx.options.company) options.companyId = String(ctx.options.company);
  if (ctx.options.responsible) options.responsibleId = String(ctx.options.responsible);
  if (ctx.options.person) options.personId = String(ctx.options.person);
  if (ctx.options.type) options.projectType = String(ctx.options.type);
  if (ctx.options.status) options.status = String(ctx.options.status);

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort();

  return options;
}

/**
 * List projects
 */
export async function projectsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching projects...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const options = parseListOptions(ctx);
    const result = await listProjects(options, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatProject, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((p) => ({
        id: p.id,
        name: p.attributes.name,
        number: p.attributes.project_number || '',
        archived: p.attributes.archived ? 'yes' : 'no',
        budget: p.attributes.budget || '',
        created: p.attributes.created_at.split('T')[0],
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      render('project', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single project by ID
 */
export async function projectsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive projects get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching project...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getProject({ id }, execCtx);
    const project = result.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatProject(project);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      humanProjectDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}
