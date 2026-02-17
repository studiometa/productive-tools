/**
 * CLI adapter for pages command handlers.
 */

import { formatPage, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  ExecutorValidationError,
  type ListPagesOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { render, createRenderContext, humanPageDetailRenderer } from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';
import { parseFilters } from '../../utils/parse-filters.js';

function parseListOptions(ctx: CommandContext): ListPagesOptions {
  const options: ListPagesOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.project) options.projectId = String(ctx.options.project);
  if (ctx.options.creator) options.creatorId = String(ctx.options.creator);

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort();

  return options;
}

export async function pagesList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching pages...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listPages(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatPage, result.meta, {
      included: result.included,
    });

    const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
    render('page', format, formattedData, renderCtx);
  }, ctx.formatter);
}

export async function pagesGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive pages get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching page...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getPage({ id }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatPage(result.data, { included: result.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanPageDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function pagesAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating page...');
  spinner.start();

  if (!ctx.options.title) {
    spinner.fail();
    handleError(ValidationError.required('title'), ctx.formatter);
    return;
  }
  if (!ctx.options.project) {
    spinner.fail();
    handleError(ValidationError.required('project'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await createPage(
      {
        title: String(ctx.options.title),
        projectId: String(ctx.options.project),
        body: ctx.options.body ? String(ctx.options.body) : undefined,
        parentPageId: ctx.options['parent-page'] ? String(ctx.options['parent-page']) : undefined,
      },
      execCtx,
    );

    spinner.succeed();

    const page = result.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ status: 'success', ...formatPage(page) });
    } else {
      ctx.formatter.success('Page created');
      console.log(colors.cyan('ID:'), page.id);
      console.log(colors.cyan('Title:'), page.attributes.title);
    }
  }, ctx.formatter);
}

export async function pagesUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive pages update <id> [options]', ctx.formatter);

  const spinner = ctx.createSpinner('Updating page...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    try {
      const result = await updatePage(
        {
          id,
          title: ctx.options.title !== undefined ? String(ctx.options.title) : undefined,
          body: ctx.options.body !== undefined ? String(ctx.options.body) : undefined,
        },
        execCtx,
      );

      spinner.succeed();

      const format = ctx.options.format || ctx.options.f || 'human';
      if (format === 'json') {
        ctx.formatter.output({ status: 'success', id: result.data.id });
      } else {
        ctx.formatter.success(`Page ${id} updated`);
      }
    } catch (error) {
      if (error instanceof ExecutorValidationError) {
        spinner.fail();
        throw ValidationError.invalid(
          'options',
          {},
          'No updates specified. Use --title or --body.',
        );
      }
      throw error;
    }
  }, ctx.formatter);
}

export async function pagesDelete(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive pages delete <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Deleting page...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    await deletePage({ id }, execCtx);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', deleted: id });
    } else {
      ctx.formatter.success(`Page ${id} deleted`);
    }
  }, ctx.formatter);
}
