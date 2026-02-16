/**
 * Handler implementations for people command
 */

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { exitWithValidationError, runCommand } from '../../error-handler.js';
import { formatPerson, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanPersonDetailRenderer } from '../../renderers/index.js';
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
 * List people
 */
export async function peopleList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching people...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Resource filtering
    if (ctx.options.company) {
      filter.company_id = String(ctx.options.company);
    }
    if (ctx.options.project) {
      filter.project_id = String(ctx.options.project);
    }
    if (ctx.options.role) {
      filter.role_id = String(ctx.options.role);
    }
    if (ctx.options.team) {
      filter.team = String(ctx.options.team);
    }

    // Person type filtering (user/contact/placeholder)
    if (ctx.options.type) {
      const typeMap: Record<string, string> = {
        user: '1',
        contact: '2',
        placeholder: '3',
      };
      const typeValue = typeMap[String(ctx.options.type).toLowerCase()];
      if (typeValue) {
        filter.person_type = typeValue;
      }
    }

    // Status filtering (active/deactivated)
    if (ctx.options.status) {
      const statusMap: Record<string, string> = {
        active: '1',
        deactivated: '2',
        inactive: '2',
      };
      const statusValue = statusMap[String(ctx.options.status).toLowerCase()];
      if (statusValue) {
        filter.status = statusValue;
      }
    }

    // Resolve any human-friendly identifiers (company name, project number, etc.)
    const { resolved: resolvedFilter } = await resolveCommandFilters(ctx, filter, {
      company_id: 'company',
      project_id: 'project',
    });

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getPeople({
      page,
      perPage,
      filter: resolvedFilter,
      sort: ctx.getSort(),
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(response.data, formatPerson, response.meta);

    if (format === 'csv' || format === 'table') {
      // For CSV/table, flatten the data for OutputFormatter
      const data = response.data.map((p) => ({
        id: p.id,
        first_name: p.attributes.first_name,
        last_name: p.attributes.last_name,
        email: p.attributes.email,
        active: p.attributes.active ? 'yes' : 'no',
      }));
      ctx.formatter.output(data);
    } else {
      // Use renderer for json and human formats
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      render('person', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single person by ID
 */
export async function peopleGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive people get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching person...');
  spinner.start();

  await runCommand(async () => {
    // Resolve person ID if it's a human-friendly identifier (e.g., email)
    const resolvedId = await tryResolveValue(ctx, id, 'person');

    const response = await ctx.api.getPerson(resolvedId);
    const person = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatPerson(person);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      // Use detail renderer for human format
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      humanPersonDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}
