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

    // Filter by company
    if (ctx.options.company) {
      filter.company_id = String(ctx.options.company);
    }

    // Filter by stage status (open, won, lost)
    const status = ctx.options.status ? String(ctx.options.status).toLowerCase() : undefined;
    if (status === 'open') {
      filter.stage_status_id = '1';
    } else if (status === 'won') {
      filter.stage_status_id = '2';
    } else if (status === 'lost') {
      filter.stage_status_id = '3';
    }

    // Filter by type (deal vs budget)
    const type = ctx.options.type ? String(ctx.options.type).toLowerCase() : undefined;
    if (type === 'deal') {
      filter.type = '1';
    } else if (type === 'budget') {
      filter.type = '2';
    }

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getDeals({
      page,
      perPage,
      filter,
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
    const response = await ctx.api.getDeal(id, {
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
    const response = await ctx.api.createDeal({
      name: String(ctx.options.name),
      company_id: String(ctx.options.company),
      date: ctx.options.date ? String(ctx.options.date) : undefined,
      budget: ctx.options.budget === true,
      responsible_id: ctx.options.responsible ? String(ctx.options.responsible) : undefined,
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
    if (ctx.options.responsible !== undefined)
      data.responsible_id = String(ctx.options.responsible);
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
