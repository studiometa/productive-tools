/**
 * CLI adapter for comments command handlers.
 */

import {
  fromCommandContext,
  listComments,
  updateComment,
  type ListCommentsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { formatComment, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanCommentDetailRenderer } from '../../renderers/index.js';
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

function parseListOptions(ctx: CommandContext): ListCommentsOptions {
  const options: ListCommentsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.task) options.taskId = String(ctx.options.task);
  if (ctx.options.deal) options.dealId = String(ctx.options.deal);
  if (ctx.options.company) options.companyId = String(ctx.options.company);
  if (ctx.options.person) options.personId = String(ctx.options.person);

  // Additional filters not in typed options
  if (ctx.options.project) {
    if (!options.additionalFilters) options.additionalFilters = {};
    options.additionalFilters.project_id = String(ctx.options.project);
  }
  if (ctx.options.page) {
    if (!options.additionalFilters) options.additionalFilters = {};
    options.additionalFilters.page_id = String(ctx.options.page);
  }
  if (ctx.options.discussion) {
    if (!options.additionalFilters) options.additionalFilters = {};
    options.additionalFilters.discussion_id = String(ctx.options.discussion);
  }

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.include = ['creator'];

  return options;
}

export async function commentsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching comments...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listComments(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatComment, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((c) => ({
        id: c.id,
        type: c.attributes.commentable_type,
        body: c.attributes.body.substring(0, 100),
        created: c.attributes.created_at.split('T')[0],
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('comment', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function commentsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive comments get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching comment...');
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getComment(id, { include: ['creator'] });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatComment(response.data);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanCommentDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function commentsAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating comment...');
  spinner.start();

  if (!ctx.options.body) {
    spinner.fail();
    handleError(ValidationError.required('body'), ctx.formatter);
    return;
  }

  // Validate parent resource
  const parentCount = [
    ctx.options.task,
    ctx.options.deal,
    ctx.options.company,
    ctx.options.invoice,
    ctx.options.person,
    ctx.options.discussion,
  ].filter(Boolean).length;

  if (parentCount === 0) {
    spinner.fail();
    handleError(
      ValidationError.invalid(
        'parent',
        undefined,
        'Must specify a parent resource: --task, --deal, --company, --invoice, --person, or --discussion',
      ),
      ctx.formatter,
    );
    return;
  }

  if (parentCount > 1) {
    spinner.fail();
    handleError(
      ValidationError.invalid('parent', undefined, 'Can only specify one parent resource'),
      ctx.formatter,
    );
    return;
  }

  await runCommand(async () => {
    const response = await ctx.api.createComment({
      body: String(ctx.options.body),
      task_id: ctx.options.task ? String(ctx.options.task) : undefined,
      deal_id: ctx.options.deal ? String(ctx.options.deal) : undefined,
      company_id: ctx.options.company ? String(ctx.options.company) : undefined,
      invoice_id: ctx.options.invoice ? String(ctx.options.invoice) : undefined,
      person_id: ctx.options.person ? String(ctx.options.person) : undefined,
      discussion_id: ctx.options.discussion ? String(ctx.options.discussion) : undefined,
    });

    spinner.succeed();

    const comment = response.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ status: 'success', ...formatComment(comment) });
    } else {
      ctx.formatter.success('Comment created');
      console.log(colors.cyan('ID:'), comment.id);
    }
  }, ctx.formatter);
}

export async function commentsUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id)
    exitWithValidationError('id', 'productive comments update <id> [options]', ctx.formatter);

  const spinner = ctx.createSpinner('Updating comment...');
  spinner.start();

  if (!ctx.options.body) {
    spinner.fail();
    handleError(ValidationError.required('body'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await updateComment({ id, body: String(ctx.options.body) }, execCtx);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', id: result.data.id });
    } else {
      ctx.formatter.success(`Comment ${id} updated`);
    }
  }, ctx.formatter);
}
