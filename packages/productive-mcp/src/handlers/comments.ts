/**
 * Comments MCP handler.
 */

import {
  listComments,
  getComment,
  createComment,
  updateComment,
} from '@studiometa/productive-core';

import type { CommentArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatComment, formatListResponse } from '../formatters.js';
import { getCommentHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get', 'create', 'update'];

export async function handleComments(
  action: string,
  args: CommentArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, body, task_id, deal_id, company_id } = args;
  const include = userInclude?.length ? [...new Set(['creator', ...userInclude])] : ['creator'];

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await getComment({ id, include }, execCtx);
    const formatted = formatComment(result.data, { ...formatOptions, included: result.included });

    if (ctx.includeHints !== false) {
      const commentableType = result.data.attributes?.commentable_type as string | undefined;
      let commentableId: string | undefined;
      if (commentableType === 'task') {
        commentableId = result.data.relationships?.task?.data?.id;
      } else if (commentableType === 'deal') {
        commentableId = result.data.relationships?.deal?.data?.id;
      } else if (commentableType === 'company') {
        commentableId = result.data.relationships?.company?.data?.id;
      }
      return jsonResult({
        ...formatted,
        _hints: getCommentHints(id, commentableType, commentableId),
      });
    }
    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!body) return inputErrorResult(ErrorMessages.missingRequiredFields('comment', ['body']));
    if (!task_id && !deal_id && !company_id) {
      return inputErrorResult(ErrorMessages.missingCommentTarget());
    }
    const result = await createComment(
      { body, taskId: task_id, dealId: deal_id, companyId: company_id },
      execCtx,
    );
    return jsonResult({ success: true, ...formatComment(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    if (!body)
      return inputErrorResult(ErrorMessages.missingRequiredFields('comment update', ['body']));
    const result = await updateComment({ id, body }, execCtx);
    return jsonResult({ success: true, ...formatComment(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await listComments(
      { page, perPage, additionalFilters: filter, include },
      execCtx,
    );
    return jsonResult(formatListResponse(result.data, formatComment, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'comments', VALID_ACTIONS));
}
