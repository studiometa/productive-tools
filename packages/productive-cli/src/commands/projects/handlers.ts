/**
 * Handler implementations for projects command
 */

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { exitWithValidationError, runCommand } from '../../error-handler.js';
import { formatProject, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanProjectDetailRenderer } from '../../renderers/index.js';
import { resolveCommandFilters, tryResolveValue } from '../../utils/resolve-filters.js';

/**
 * Parse filter string into key-value pairs
 */
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

/**
 * List projects
 */
export async function projectsList(ctx: CommandContext): Promise<void> {
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
    if (ctx.options.responsible) {
      filter.responsible_id = String(ctx.options.responsible);
    }
    if (ctx.options.person) {
      filter.person_id = String(ctx.options.person);
    }

    // Project type filtering (internal/client)
    if (ctx.options.type) {
      const typeMap: Record<string, string> = {
        internal: '1',
        client: '2',
      };
      const typeValue = typeMap[String(ctx.options.type).toLowerCase()];
      if (typeValue) {
        filter.project_type = typeValue;
      }
    }

    // Status filtering (active/archived)
    if (ctx.options.status) {
      const statusMap: Record<string, string> = {
        active: '1',
        archived: '2',
      };
      const statusValue = statusMap[String(ctx.options.status).toLowerCase()];
      if (statusValue) {
        filter.status = statusValue;
      }
    }

    // Resolve any human-friendly identifiers (email, company name, etc.)
    const { resolved: resolvedFilter } = await resolveCommandFilters(ctx, filter, {
      company_id: 'company',
      responsible_id: 'person',
      person_id: 'person',
    });

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getProjects({
      page,
      perPage,
      filter: resolvedFilter,
      sort: ctx.getSort(),
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(response.data, formatProject, response.meta);

    if (format === 'csv' || format === 'table') {
      // For CSV/table, flatten the data for OutputFormatter
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
      // Use renderer for json and human formats
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
    // Resolve project ID if it's a human-friendly identifier (e.g., PRJ-123)
    const resolvedId = await tryResolveValue(ctx, id, 'project');

    const response = await ctx.api.getProject(resolvedId);
    const project = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatProject(project);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      // Use detail renderer for human format
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      humanProjectDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}
