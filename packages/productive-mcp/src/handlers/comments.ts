/**
 * Comments resource handler
 */

import type { HandlerContext, CommentArgs, ToolResult } from './types.js';

import { formatComment, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

/** Default includes for comments */
const DEFAULT_COMMENT_INCLUDE = ['creator'];

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
    if (!id) return errorResult('id is required for get action');
    const result = await api.getComment(id, { include });
    return jsonResult(formatComment(result.data, { ...formatOptions, included: result.included }));
  }

  if (action === 'create') {
    if (!body) return errorResult('body is required for create');
    if (!task_id && !deal_id && !company_id) {
      return errorResult('task_id, deal_id, or company_id is required for create');
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
    if (!id) return errorResult('id is required for update action');
    if (!body) return errorResult('body is required for update');
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

  return errorResult(`Invalid action "${action}" for comments. Use: list, get, create, update`);
}
