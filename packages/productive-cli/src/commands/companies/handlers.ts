/**
 * CLI adapter for companies command handlers.
 */

import {
  fromCommandContext,
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  ExecutorValidationError,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { formatCompany, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanCompanyDetailRenderer } from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';

function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  if (!filterString) return filters;
  filterString.split(',').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) filters[key.trim()] = value.trim();
  });
  return filters;
}

export async function companiesList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching companies...');
  spinner.start();

  await runCommand(async () => {
    const additionalFilters: Record<string, string> = {};
    if (ctx.options.filter)
      Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));

    const execCtx = fromCommandContext(ctx);
    const { page, perPage } = ctx.getPagination();
    const result = await listCompanies(
      {
        archived: ctx.options.archived === true,
        additionalFilters:
          Object.keys(additionalFilters).length > 0 ? additionalFilters : undefined,
        page,
        perPage,
        sort: ctx.getSort(),
      },
      execCtx,
    );

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatCompany, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((c) => ({
        id: c.id,
        name: c.attributes.name,
        code: c.attributes.company_code || '',
        currency: c.attributes.default_currency || '',
        vat: c.attributes.vat || '',
        created: c.attributes.created_at.split('T')[0],
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('company', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function companiesGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive companies get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching company...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getCompany({ id }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatCompany(result.data);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanCompanyDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function companiesAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating company...');
  spinner.start();

  if (!ctx.options.name) {
    spinner.fail();
    handleError(ValidationError.required('name'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await createCompany(
      {
        name: String(ctx.options.name),
        billingName: ctx.options['billing-name'] ? String(ctx.options['billing-name']) : undefined,
        vat: ctx.options.vat ? String(ctx.options.vat) : undefined,
        defaultCurrency: ctx.options.currency ? String(ctx.options.currency) : undefined,
        companyCode: ctx.options.code ? String(ctx.options.code) : undefined,
        domain: ctx.options.domain ? String(ctx.options.domain) : undefined,
        dueDays: ctx.options['due-days'] ? parseInt(String(ctx.options['due-days'])) : undefined,
      },
      execCtx,
    );

    spinner.succeed();

    const company = result.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ status: 'success', ...formatCompany(company) });
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

export async function companiesUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id)
    exitWithValidationError('id', 'productive companies update <id> [options]', ctx.formatter);

  const spinner = ctx.createSpinner('Updating company...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    try {
      const result = await updateCompany(
        {
          id,
          name: ctx.options.name !== undefined ? String(ctx.options.name) : undefined,
          billingName:
            ctx.options['billing-name'] !== undefined
              ? String(ctx.options['billing-name'])
              : undefined,
          vat: ctx.options.vat !== undefined ? String(ctx.options.vat) : undefined,
          defaultCurrency:
            ctx.options.currency !== undefined ? String(ctx.options.currency) : undefined,
          companyCode: ctx.options.code !== undefined ? String(ctx.options.code) : undefined,
          domain: ctx.options.domain !== undefined ? String(ctx.options.domain) : undefined,
          dueDays:
            ctx.options['due-days'] !== undefined
              ? parseInt(String(ctx.options['due-days']))
              : undefined,
        },
        execCtx,
      );

      spinner.succeed();

      const format = ctx.options.format || ctx.options.f || 'human';
      if (format === 'json') {
        ctx.formatter.output({ status: 'success', id: result.data.id });
      } else {
        ctx.formatter.success(`Company ${id} updated`);
      }
    } catch (error) {
      if (error instanceof ExecutorValidationError) {
        spinner.fail();
        throw ValidationError.invalid(
          'options',
          {},
          'No updates specified. Use --name, --billing-name, --vat, --currency, etc.',
        );
      }
      throw error;
    }
  }, ctx.formatter);
}
