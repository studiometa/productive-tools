/**
 * Discussions MCP handler.
 */

import {
  listDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  resolveDiscussion,
  reopenDiscussion,
} from '@studiometa/productive-core';

import type { HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatDiscussion } from '../formatters.js';
import { getDiscussionHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

export interface DiscussionArgs {
  id?: string;
  title?: string;
  body?: string;
  page_id?: string;
  status?: string;
}

const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'delete', 'resolve', 'reopen'];

export async function handleDiscussions(
  action: string,
  args: DiscussionArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage } = ctx;
  const { id, title, body, page_id, status } = args;

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

    const result = await getDiscussion({ id }, execCtx);
    const formatted = formatDiscussion(result.data, formatOptions);

    if (ctx.includeHints !== false) {
      return jsonResult({ ...formatted, _hints: getDiscussionHints(id, page_id) });
    }
    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!body || !page_id) {
      return inputErrorResult(
        ErrorMessages.missingRequiredFields('discussion', ['body', 'page_id']),
      );
    }
    const result = await createDiscussion(
      {
        body,
        pageId: page_id,
        title,
      },
      execCtx,
    );
    return jsonResult({ success: true, ...formatDiscussion(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const result = await updateDiscussion({ id, title, body }, execCtx);
    return jsonResult({ success: true, ...formatDiscussion(result.data, formatOptions) });
  }

  if (action === 'delete') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('delete'));
    await deleteDiscussion({ id }, execCtx);
    return jsonResult({ success: true, deleted: id });
  }

  if (action === 'resolve') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('resolve'));
    const result = await resolveDiscussion({ id }, execCtx);
    return jsonResult({ success: true, ...formatDiscussion(result.data, formatOptions) });
  }

  if (action === 'reopen') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('reopen'));
    const result = await reopenDiscussion({ id }, execCtx);
    return jsonResult({ success: true, ...formatDiscussion(result.data, formatOptions) });
  }

  if (action === 'list') {
    const listOptions: {
      page?: number;
      perPage?: number;
      additionalFilters?: Record<string, string>;
      status?: string;
    } = {
      page,
      perPage,
      additionalFilters: filter,
    };
    if (status) listOptions.status = status;

    const result = await listDiscussions(listOptions, execCtx);

    const response = formatListResponse(result.data, formatDiscussion, result.meta, formatOptions);

    if (result.resolved && Object.keys(result.resolved).length > 0) {
      return jsonResult({ ...response, _resolved: result.resolved });
    }
    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'discussions', VALID_ACTIONS));
}
