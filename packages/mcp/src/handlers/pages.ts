/**
 * Pages MCP handler.
 */

import {
  listPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
} from '@studiometa/productive-core';

import type { HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatPage } from '../formatters.js';
import { getPageHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

export interface PageArgs {
  id?: string;
  title?: string;
  body?: string;
  project_id?: string;
  parent_page_id?: string;
}

const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'delete'];

export async function handlePages(
  action: string,
  args: PageArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage } = ctx;
  const { id, title, body, project_id, parent_page_id } = args;

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

    const result = await getPage({ id }, execCtx);
    const formatted = formatPage(result.data, formatOptions);

    if (ctx.includeHints !== false) {
      return jsonResult({ ...formatted, _hints: getPageHints(id) });
    }
    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!title || !project_id) {
      return inputErrorResult(ErrorMessages.missingRequiredFields('page', ['title', 'project_id']));
    }
    const result = await createPage(
      {
        title,
        projectId: project_id,
        body,
        parentPageId: parent_page_id,
      },
      execCtx,
    );
    return jsonResult({ success: true, ...formatPage(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const result = await updatePage({ id, title, body }, execCtx);
    return jsonResult({ success: true, ...formatPage(result.data, formatOptions) });
  }

  if (action === 'delete') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('delete'));
    await deletePage({ id }, execCtx);
    return jsonResult({ success: true, deleted: id });
  }

  if (action === 'list') {
    const result = await listPages({ page, perPage, additionalFilters: filter }, execCtx);

    const response = formatListResponse(result.data, formatPage, result.meta, formatOptions);

    if (result.resolved && Object.keys(result.resolved).length > 0) {
      return jsonResult({ ...response, _resolved: result.resolved });
    }
    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'pages', VALID_ACTIONS));
}
