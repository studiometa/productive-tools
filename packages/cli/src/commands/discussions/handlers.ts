/**
 * CLI adapter for discussions command handlers.
 */

import { formatDiscussion, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  listDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  resolveDiscussion,
  reopenDiscussion,
  ExecutorValidationError,
  type ListDiscussionsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { handleError, exitWithValidationError, runCommand } from '../../error-handler.js';
import { ValidationError } from '../../errors.js';
import {
  render,
  createRenderContext,
  humanDiscussionDetailRenderer,
} from '../../renderers/index.js';
import { colors } from '../../utils/colors.js';
import { isDryRun, handleDryRunOutput } from '../../utils/dry-run.js';
import { parseFilters } from '../../utils/parse-filters.js';

function parseListOptions(ctx: CommandContext): ListDiscussionsOptions {
  const options: ListDiscussionsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.page_id) options.pageId = String(ctx.options.page_id);
  if (ctx.options['page-id']) options.pageId = String(ctx.options['page-id']);
  if (ctx.options.status) options.status = String(ctx.options.status);

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;
  options.sort = ctx.getSort();

  return options;
}

export async function discussionsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching discussions...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listDiscussions(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatDiscussion, result.meta, {
      included: result.included,
    });

    const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
    render('discussion', format, formattedData, renderCtx);
  }, ctx.formatter);
}

export async function discussionsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive discussions get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching discussion...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getDiscussion({ id }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatDiscussion(result.data, { included: result.included });

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanDiscussionDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function discussionsAdd(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Creating discussion...');
  spinner.start();

  if (!ctx.options.body) {
    spinner.fail();
    handleError(ValidationError.required('body'), ctx.formatter);
    return;
  }
  if (!ctx.options['page-id']) {
    spinner.fail();
    handleError(ValidationError.required('page-id'), ctx.formatter);
    return;
  }

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const payload = {
      body: String(ctx.options.body),
      pageId: String(ctx.options['page-id']),
      title: ctx.options.title ? String(ctx.options.title) : undefined,
    };

    if (isDryRun(ctx)) {
      handleDryRunOutput(
        {
          action: 'create',
          resource: 'discussion',
          payload,
          description: `Discussion on page ${payload.pageId}${payload.title ? ` ("${payload.title}")` : ''}`,
        },
        ctx,
        spinner,
      );
      return;
    }

    const result = await createDiscussion(payload, execCtx);

    spinner.succeed();

    const discussion = result.data;
    const format = ctx.options.format || ctx.options.f || 'human';

    if (format === 'json') {
      ctx.formatter.output({ success: true, ...formatDiscussion(discussion) });
    } else {
      ctx.formatter.success('Discussion created');
      console.log(colors.cyan('ID:'), discussion.id);
      if (discussion.attributes.title) {
        console.log(colors.cyan('Title:'), discussion.attributes.title);
      }
    }
  }, ctx.formatter);
}

export async function discussionsUpdate(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id)
    exitWithValidationError('id', 'productive discussions update <id> [options]', ctx.formatter);

  const spinner = ctx.createSpinner('Updating discussion...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const payload = {
      id,
      title: ctx.options.title !== undefined ? String(ctx.options.title) : undefined,
      body: ctx.options.body !== undefined ? String(ctx.options.body) : undefined,
    };

    // Check for validation before dry-run to ensure consistent behavior
    const hasUpdates = payload.title !== undefined || payload.body !== undefined;
    if (!hasUpdates) {
      spinner.fail();
      throw ValidationError.invalid('options', {}, 'No updates specified. Use --title or --body.');
    }

    if (isDryRun(ctx)) {
      handleDryRunOutput(
        {
          action: 'update',
          resource: 'discussion',
          resourceId: id,
          payload,
        },
        ctx,
        spinner,
      );
      return;
    }

    try {
      const result = await updateDiscussion(payload, execCtx);

      spinner.succeed();

      const format = ctx.options.format || ctx.options.f || 'human';
      if (format === 'json') {
        ctx.formatter.output({ status: 'success', id: result.data.id });
      } else {
        ctx.formatter.success(`Discussion ${id} updated`);
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

export async function discussionsDelete(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;

  if (!id) {
    exitWithValidationError('id', 'productive discussions delete <id>', ctx.formatter);
  }

  const spinner = ctx.createSpinner('Deleting discussion...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    if (isDryRun(ctx)) {
      handleDryRunOutput(
        {
          action: 'delete',
          resource: 'discussion',
          resourceId: id,
        },
        ctx,
        spinner,
      );
      return;
    }

    await deleteDiscussion({ id }, execCtx);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', deleted: id });
    } else {
      ctx.formatter.success(`Discussion ${id} deleted`);
    }
  }, ctx.formatter);
}

export async function discussionsResolve(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive discussions resolve <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Resolving discussion...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    if (isDryRun(ctx)) {
      handleDryRunOutput(
        {
          action: 'resolve',
          resource: 'discussion',
          resourceId: id,
        },
        ctx,
        spinner,
      );
      return;
    }

    const result = await resolveDiscussion({ id }, execCtx);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ success: true, ...formatDiscussion(result.data) });
    } else {
      ctx.formatter.success(`Discussion ${id} resolved`);
    }
  }, ctx.formatter);
}

export async function discussionsReopen(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive discussions reopen <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Reopening discussion...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);

    if (isDryRun(ctx)) {
      handleDryRunOutput(
        {
          action: 'reopen',
          resource: 'discussion',
          resourceId: id,
        },
        ctx,
        spinner,
      );
      return;
    }

    const result = await reopenDiscussion({ id }, execCtx);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ success: true, ...formatDiscussion(result.data) });
    } else {
      ctx.formatter.success(`Discussion ${id} reopened`);
    }
  }, ctx.formatter);
}
