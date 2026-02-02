/**
 * Handler implementations for companies command
 */

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { formatCompany, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanCompanyDetailRenderer } from '../../renderers/index.js';
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
 * List companies
 */
export async function companiesList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching companies...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Filter by archived status
    if (ctx.options.archived === true) {
      filter.status = '2'; // archived
    } else if (ctx.options.archived === false || ctx.options.archived === undefined) {
      filter.status = '1'; // active (default)
    }

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getCompanies({
      page,
      perPage,
      filter,
      sort: ctx.getSort(),
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(response.data, formatCompany, response.meta);

    if (format === 'csv' || format === 'table') {
      const data = response.data.map((c) => ({
        id: c.id,
        name: c.attributes.name,
        code: c.attributes.company_code || '',
        currency: c.attributes.default_currency || '',
        vat: c.attributes.vat || '',
        created: c.attributes.created_at.split('T')[0],
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      render('company', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single company by ID
 */
export async function companiesGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive companies get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching company...');
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getCompany(id);
    const company = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatCompany(company);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      humanCompanyDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Add a new company
 */
export async function companiesAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating company...');
  spinner.start();

  if (!ctx.options.name) {
    spinner.fail();
    handleError(ValidationError.required('name'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    const response = await ctx.api.createCompany({
      name: String(ctx.options.name),
      billing_name: ctx.options['billing-name'] ? String(ctx.options['billing-name']) : undefined,
      vat: ctx.options.vat ? String(ctx.options.vat) : undefined,
      default_currency: ctx.options.currency ? String(ctx.options.currency) : undefined,
      company_code: ctx.options.code ? String(ctx.options.code) : undefined,
      domain: ctx.options.domain ? String(ctx.options.domain) : undefined,
      due_days: ctx.options['due-days'] ? parseInt(String(ctx.options['due-days'])) : undefined,
    });

    spinner.succeed();

    const company = response.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({
        status: 'success',
        ...formatCompany(company),
      });
    } else {
      ctx.formatter.success('Company created');
      console.log(colors.cyan('ID:'), company.id);
      console.log(colors.cyan('Name:'), company.attributes.name);
      if (company.attributes.company_code) {
        console.log(colors.cyan('Code:'), company.attributes.company_code);
      }
    }
  }, ctx.formatter);
}

/**
 * Update an existing company
 */
export async function companiesUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive companies update <id> [options]', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Updating company...');
  spinner.start();

  await runCommand(async () => {
    const data: Parameters<typeof ctx.api.updateCompany>[1] = {};

    if (ctx.options.name !== undefined) data.name = String(ctx.options.name);
    if (ctx.options['billing-name'] !== undefined)
      data.billing_name = String(ctx.options['billing-name']);
    if (ctx.options.vat !== undefined) data.vat = String(ctx.options.vat);
    if (ctx.options.currency !== undefined) data.default_currency = String(ctx.options.currency);
    if (ctx.options.code !== undefined) data.company_code = String(ctx.options.code);
    if (ctx.options.domain !== undefined) data.domain = String(ctx.options.domain);
    if (ctx.options['due-days'] !== undefined)
      data.due_days = parseInt(String(ctx.options['due-days']));

    if (Object.keys(data).length === 0) {
      spinner.fail();
      throw ValidationError.invalid(
        'options',
        data,
        'No updates specified. Use --name, --billing-name, --vat, --currency, etc.',
      );
    }

    const response = await ctx.api.updateCompany(id, data);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', id: response.data.id });
    } else {
      ctx.formatter.success(`Company ${id} updated`);
    }
  }, ctx.formatter);
}
