/**
 * CLI adapter for attachments command handlers.
 */

import { formatAttachment, formatListResponse } from '@studiometa/productive-api';
import {
  fromCommandContext,
  getAttachment,
  listAttachments,
  deleteAttachment,
  type ListAttachmentsOptions,
} from '@studiometa/productive-core';

import type { CommandContext } from '../../context.js';
import type { OutputFormat } from '../../types.js';

import { exitWithValidationError, runCommand } from '../../error-handler.js';
import {
  render,
  createRenderContext,
  humanAttachmentDetailRenderer,
} from '../../renderers/index.js';
import { parseFilters } from '../../utils/parse-filters.js';

function parseListOptions(ctx: CommandContext): ListAttachmentsOptions {
  const options: ListAttachmentsOptions = {};

  const additionalFilters: Record<string, string> = {};
  if (ctx.options.filter)
    Object.assign(additionalFilters, parseFilters(String(ctx.options.filter)));
  if (Object.keys(additionalFilters).length > 0) options.additionalFilters = additionalFilters;

  if (ctx.options.task) options.taskId = String(ctx.options.task);
  if (ctx.options.comment) options.commentId = String(ctx.options.comment);
  if (ctx.options.page) options.pageId = String(ctx.options.page);
  if (ctx.options.deal) options.dealId = String(ctx.options.deal);

  const { page, perPage } = ctx.getPagination();
  options.page = page;
  options.perPage = perPage;

  return options;
}

export async function attachmentsList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching attachments...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await listAttachments(parseListOptions(ctx), execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatListResponse(result.data, formatAttachment, result.meta);

    if (format === 'csv' || format === 'table') {
      const data = result.data.map((a) => ({
        id: a.id,
        name: a.attributes.name,
        type: a.attributes.content_type,
        size: a.attributes.size,
        created: a.attributes.created_at?.split('T')[0] ?? '',
      }));
      ctx.formatter.output(data);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      render('attachment', format, formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function attachmentsGet(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive attachments get <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Fetching attachment...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    const result = await getAttachment({ id }, execCtx);

    spinner.succeed();

    const format = (ctx.options.format || ctx.options.f || 'human') as OutputFormat;
    const formattedData = formatAttachment(result.data);

    if (format === 'json') {
      ctx.formatter.output(formattedData);
    } else {
      const renderCtx = createRenderContext({ noColor: ctx.options['no-color'] === true });
      humanAttachmentDetailRenderer.render(formattedData, renderCtx);
    }
  }, ctx.formatter);
}

export async function attachmentsDelete(args: string[], ctx: CommandContext): Promise<void> {
  const [id] = args;
  if (!id) exitWithValidationError('id', 'productive attachments delete <id>', ctx.formatter);

  const spinner = ctx.createSpinner('Deleting attachment...');
  spinner.start();

  await runCommand(async () => {
    const execCtx = fromCommandContext(ctx);
    await deleteAttachment({ id }, execCtx);

    spinner.succeed();

    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'json') {
      ctx.formatter.output({ status: 'success', deleted: id });
    } else {
      ctx.formatter.success(`Attachment ${id} deleted`);
    }
  }, ctx.formatter);
}
