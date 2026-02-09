/**
 * Comments resource handler
 */

import type { CommentArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatComment, formatListResponse } from '../formatters.js';
import { getCommentHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

/** Default includes for comments */
const DEFAULT_COMMENT_INCLUDE = ['creator'];
const VALID_ACTIONS = ['list', 'get', 'create', 'update'];

export async function handleComments(
  action: string,
  args: CommentArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, body, task_id, deal_id, company_id } = args;
  // Merge default includes with user-provided includes
  const include = userInclude?.length
    ? [...new Set([...DEFAULT_COMMENT_INCLUDE, ...userInclude])]
    : DEFAULT_COMMENT_INCLUDE;

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await api.getComment(id, { include });
    const formatted = formatComment(result.data, {
      ...formatOptions,
      included: result.included,
    });

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      const commentableType = result.data.attributes?.commentable_type as string | undefined;
      // Determine the commentable ID from relationships
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
    const result = await api.createComment({
      body,
      task_id,
      deal_id,
      company_id,
    });
    return jsonResult({ success: true, ...formatComment(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    if (!body)
      return inputErrorResult(ErrorMessages.missingRequiredFields('comment update', ['body']));
    const result = await api.updateComment(id, { body });
    return jsonResult({ success: true, ...formatComment(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getComments({ filter, page, perPage, include });
    return jsonResult(
      formatListResponse(result.data, formatComment, result.meta, {
        ...formatOptions,
        included: result.included,
      }),
    );
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'comments', VALID_ACTIONS));
}
