/**
 * Projects resource handler
 */

import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatProject } from '../formatters.js';
import { getProjectHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['list', 'get'];

export async function handleProjects(
  action: string,
  args: CommonArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id } = args;

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await api.getProject(id);
    const formatted = formatProject(result.data, formatOptions);

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      return jsonResult({
        ...formatted,
        _hints: getProjectHints(id),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'list') {
    const result = await api.getProjects({ filter, page, perPage });
    return jsonResult(formatListResponse(result.data, formatProject, result.meta, formatOptions));
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'projects', VALID_ACTIONS));
}
