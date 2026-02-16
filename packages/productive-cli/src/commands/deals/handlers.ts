/**
 * Handler implementations for deals command
 */

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { formatDeal, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanDealDetailRenderer } from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';
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
 * List deals
 */
export async function dealsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching deals...');
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
    if (ctx.options.responsible) {
      filter.responsible_id = String(ctx.options.responsible);
    }
    if (ctx.options.pipeline) {
      filter.pipeline_id = String(ctx.options.pipeline);
    }

    // Stage status filtering (open, won, lost)
    if (ctx.options.status) {
      const statusMap: Record<string, string> = {
        open: '1',
        won: '2',
        lost: '3',
      };
      const statusValue = statusMap[String(ctx.options.status).toLowerCase()];
      if (statusValue) {
        filter.stage_status_id = statusValue;
      }
    }

    // Type filtering (deal vs budget)
    if (ctx.options.type) {
      const typeMap: Record<string, string> = {
        deal: '1',
        budget: '2',
      };
      const typeValue = typeMap[String(ctx.options.type).toLowerCase()];
      if (typeValue) {
        filter.type = typeValue;
      }
    }

    // Budget status filtering (open/closed) - only for budgets
    if (ctx.options['budget-status']) {
      const budgetStatusMap: Record<string, string> = {
        open: '1',
        closed: '2',
      };
      const budgetStatusValue = budgetStatusMap[String(ctx.options['budget-status']).toLowerCase()];
      if (budgetStatusValue) {
        filter.budget_status = budgetStatusValue;
      }
    }

    // Resolve any human-friendly identifiers (company name, project number, etc.)
    const { resolved: resolvedFilter } = await resolveCommandFilters(ctx, filter, {
      company_id: 'company',
      project_id: 'project',
      responsible_id: 'person',
    });

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getDeals({
      page,
      perPage,
      filter: resolvedFilter,
      sort: ctx.getSort(),
      include: ['company', 'deal_status', 'responsible'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(response.data, formatDeal, response.meta, {
      included: response.included,
    });

    if (format === 'csv' || format === 'table') {
      const data = response.data.map((d) => ({
        id: d.id,
        number: d.attributes.number || '',
        name: d.attributes.name,
        type: d.attributes.budget ? 'budget' : 'deal',
        date: d.attributes.date || '',
        created: d.attributes.created_at.split('T')[0],
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      render('deal', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single deal by ID
 */
export async function dealsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive deals get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching deal...');
  spinner.start();

  await runCommand(async () => {
    // Resolve deal ID if it's a human-friendly identifier (e.g., D-123)
    const resolvedId = await tryResolveValue(ctx, id, 'deal');

    const response = await ctx.api.getDeal(resolvedId, {
      include: ['company', 'deal_status', 'responsible', 'project'],
    });
    const deal = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatDeal(deal, { included: response.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      humanDealDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Add a new deal
 */
export async function dealsAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating deal...');
  spinner.start();

  if (!ctx.options.name) {
    spinner.fail();
    handleError(ValidationError.required('name'), ctx.formatter);
    return;
  }

  if (!ctx.options.company) {
    spinner.fail();
    handleError(ValidationError.required('company'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    // Resolve company ID if it's a human-friendly identifier
    const companyId = await tryResolveValue(ctx, String(ctx.options.company), 'company');

    // Resolve responsible ID if provided
    const responsibleId = ctx.options.responsible
      ? await tryResolveValue(ctx, String(ctx.options.responsible), 'person')
      : undefined;

    const response = await ctx.api.createDeal({
      name: String(ctx.options.name),
      company_id: companyId,
      date: ctx.options.date ? String(ctx.options.date) : undefined,
      budget: ctx.options.budget === true,
      responsible_id: responsibleId,
    });

    spinner.succeed();

    const deal = response.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({
        status: 'success',
        ...formatDeal(deal),
      });
    } else {
      const type = deal.attributes.budget ? 'Budget' : 'Deal';
      ctx.formatter.success(`${type} created`);
      console.log(colors.cyan('ID:'), deal.id);
      console.log(colors.cyan('Name:'), deal.attributes.name);
      if (deal.attributes.number) {
        console.log(colors.cyan('Number:'), `#${deal.attributes.number}`);
      }
    }
  }, ctx.formatter);
}

/**
 * Update an existing deal
 */
export async function dealsUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive deals update <id> [options]', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Updating deal...');
  spinner.start();

  await runCommand(async () => {
    const data: Parameters<typeof ctx.api.updateDeal>[1] = {};

    if (ctx.options.name !== undefined) data.name = String(ctx.options.name);
    if (ctx.options.date !== undefined) data.date = String(ctx.options.date);
    if (ctx.options['end-date'] !== undefined) data.end_date = String(ctx.options['end-date']);
    if (ctx.options.responsible !== undefined) {
      // Resolve responsible ID if it's a human-friendly identifier
      data.responsible_id = await tryResolveValue(ctx, String(ctx.options.responsible), 'person');
    }
    if (ctx.options.status !== undefined) data.deal_status_id = String(ctx.options.status);

    if (Object.keys(data).length === 0) {
      spinner.fail();
      throw ValidationError.invalid(
        'options',
        data,
        'No updates specified. Use --name, --date, --end-date, --responsible, --status, etc.',
      );
    }

    const response = await ctx.api.updateDeal(id, data);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', id: response.data.id });
    } else {
      ctx.formatter.success(`Deal ${id} updated`);
    }
  }, ctx.formatter);
}
