/**
 * Attachments MCP handler.
 */

import { listAttachments, getAttachment, deleteAttachment } from '@studiometa/productive-core';

import type { AttachmentArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatAttachment, formatListResponse } from '../formatters.js';
import { getAttachmentHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'delete'];

export async function handleAttachments(
  action: string,
  args: AttachmentArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage } = ctx;
  const { id, task_id, comment_id, deal_id } = args;

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await getAttachment({ id }, execCtx);
    const formatted = formatAttachment(result.data, formatOptions);

    if (ctx.includeHints !== false) {
      const attachableType = result.data.attributes?.attachable_type as string | undefined;
      return jsonResult({
        ...formatted,
        _hints: getAttachmentHints(id, attachableType),
      });
    }
    return jsonResult(formatted);
  }

  if (action === 'delete') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('delete'));
    await deleteAttachment({ id }, execCtx);
    return jsonResult({ success: true, deleted: id });
  }

  if (action === 'list') {
    const options: Record<string, string> = { ...filter };
    if (task_id) options.task_id = task_id;
    if (comment_id) options.comment_id = comment_id;
    if (deal_id) options.deal_id = deal_id;

    const result = await listAttachments({ page, perPage, additionalFilters: options }, execCtx);
    return jsonResult(
      formatListResponse(result.data, formatAttachment, result.meta, formatOptions),
    );
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'attachments', VALID_ACTIONS));
}
