/**
 * CLI adapter for custom-fields command handlers.
 */

import { formatCustomField, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  getCustomField,
  listCustomFields,
  type GetCustomFieldOptions,
  type ListCustomFieldsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { runCommand } from '../../error-handler.js';
import { humanCustomFieldListRenderer } from '../../renderers/human/custom-field.js';
import { render, createRenderContext } from '../../renderers/index.js';
import { parseFilters } from '../../utils/parse-filters.js';

function parseListOptions(ctx: CommandContext): ListCustomFieldsOptions {
  const options: ListCustomFieldsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (ctx.options.type) additionalFilters.customizable_type = String(ctx.options.type);
  if (ctx.options.archived !== undefined) additionalFilters.archived = String(ctx.options.archived);
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.include) {
    options.include = String(ctx.options.include).split(',');
  }

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;

  return options;
}

export async function customFieldsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching custom fields...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listCustomFields(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatCustomField, result.meta, {
      included: result.included,
    });

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((f) => ({
        id: f.id,
        name: f.attributes.name,
        data_type: f.attributes.data_type,
        customizable_type: f.attributes.customizable_type,
        archived: f.attributes.archived,
        required: f.attributes.required,
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('custom-field', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function customFieldsGet(args: string[], ctx: CommandContext): Promise<void> {
  const id = args[0];
  if (!id) {
    ctx.formatter.error('Missing custom field ID. Usage: productive custom-fields get <id>');
    return;
  }

  const spinner = ctx.createSpinner(`Fetching custom field ${id}...`);
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const options: GetCustomFieldOptions = {
      id,
      include: ctx.options.include ? String(ctx.options.include).split(',') : ['options'],
    };
    const result = await getCustomField(options, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formatted = formatCustomField(result.data, { included: result.included });

    if (format === 'csv' || format === 'table') {
      ctx.formatter.output([formatted]);
    } else if (format === 'human') {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanCustomFieldListRenderer.renderItem(formatted, renderCtx);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('custom-field', format, formatted, renderCtx);
    }
  }, ctx.formatter);
}
