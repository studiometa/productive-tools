/**
 * Handler implementations for comments command
 */

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import { formatComment, formatListResponse } from '../../formatters/index.js';
import { render, createRenderContext, humanCommentDetailRenderer } from '../../renderers/index.js';
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
 * List comments
 */
export async function commentsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching comments...');
  spinner.start();

  await runCommand(async () => {
    const filter: Record<string, string> = {};

    if (ctx.options.filter) {
      Object.assign(filter, parseFilters(String(ctx.options.filter)));
    }

    // Filter by parent resource
    if (ctx.options.task) filter.task_id = String(ctx.options.task);
    if (ctx.options.deal) filter.deal_id = String(ctx.options.deal);
    if (ctx.options.project) filter.project_id = String(ctx.options.project);
    if (ctx.options.page) filter.page_id = String(ctx.options.page);
    if (ctx.options.discussion) filter.discussion_id = String(ctx.options.discussion);

    const { page, perPage } = ctx.getPagination();
    const response = await ctx.api.getComments({
      page,
      perPage,
      filter,
      include: ['creator'],
    });

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(response.data, formatComment, response.meta, {
      included: response.included,
    });

    if (format === 'csv' || format === 'table') {
      const data = response.data.map((c) => ({
        id: c.id,
        type: c.attributes.commentable_type,
        body: c.attributes.body.substring(0, 100),
        created: c.attributes.created_at.split('T')[0],
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      render('comment', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Get a single comment by ID
 */
export async function commentsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive comments get <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Fetching comment...');
  spinner.start();

  await runCommand(async () => {
    const response = await ctx.api.getComment(id, {
      include: ['creator'],
    });
    const comment = response.data;

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatComment(comment, { included: response.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({
        noColor: ctx.options['no-color'] === true,
      });
      humanCommentDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

/**
 * Add a new comment
 */
export async function commentsAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating comment...');
  spinner.start();

  if (!ctx.options.body) {
    spinner.fail();
    handleError(ValidationError.required('body'), ctx.formatter);
    return;
  }

  // Must have exactly one parent resource
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
      ctx.formatter.output({
        status: 'success',
        ...formatComment(comment),
      });
    } else {
      ctx.formatter.success('Comment created');
      console.log(colors.cyan('ID:'), comment.id);
      console.log(colors.cyan('Type:'), comment.attributes.commentable_type);
      const preview = comment.attributes.body.substring(0, 80);
      console.log(
        colors.cyan('Body:'),
        preview + (comment.attributes.body.length > 80 ? '...' : ''),
      );
    }
  }, ctx.formatter);
}

/**
 * Update an existing comment
 */
export async function commentsUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive comments update <id> [options]', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Updating comment...');
  spinner.start();

  await runCommand(async () => {
    const data: Parameters<typeof ctx.api.updateComment>[1] = {};

    if (ctx.options.body !== undefined) data.body = String(ctx.options.body);

    if (Object.keys(data).length === 0) {
      spinner.fail();
      throw ValidationError.invalid(
        'options',
        data,
        'No updates specified. Use --body to update the comment text.',
      );
    }

    const response = await ctx.api.updateComment(id, data);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', id: response.data.id });
    } else {
      ctx.formatter.success(`Comment ${id} updated`);
    }
  }, ctx.formatter);
}
