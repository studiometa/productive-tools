/**
 * Tasks MCP handler.
 */

import { listTasks, getTask, createTask, updateTask } from '@studiometa/productive-core';

import type { HandlerContext, TaskArgs, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatTask } from '../formatters.js';
import { getTaskHints } from '../hints.js';
import { handleResolve, type ResolvableResourceType } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

const DEFAULT_TASK_INCLUDE = ['project', 'project.company'];
const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'resolve'];

export async function handleTasks(
  action: string,
  args: TaskArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, title, project_id, task_list_id, description, assignee_id, query, type } = args;
  const include = userInclude?.length
    ? [...new Set([...DEFAULT_TASK_INCLUDE, ...userInclude])]
    : DEFAULT_TASK_INCLUDE;

  if (action === 'resolve') {
    return handleResolve({ query, type, project_id }, ctx);
  }

  const execCtx = ctx.executor();

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

    const result = await getTask({ id, include }, execCtx);
    const formatted = formatTask(result.data, { ...formatOptions, included: result.included });

    if (ctx.includeHints !== false) {
      const serviceId = result.data.relationships?.service?.data?.id;
      return jsonResult({ ...formatted, _hints: getTaskHints(id, serviceId) });
    }
    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!title || !project_id || !task_list_id) {
      return inputErrorResult(
        ErrorMessages.missingRequiredFields('task', ['title', 'project_id', 'task_list_id']),
      );
    }
    const result = await createTask(
      {
        title,
        projectId: project_id,
        taskListId: task_list_id,
        assigneeId: assignee_id,
        description,
      },
      execCtx,
    );
    return jsonResult({ success: true, ...formatTask(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const result = await updateTask(
      {
        id,
        title,
        description,
        assigneeId: assignee_id,
      },
      execCtx,
    );
    return jsonResult({ success: true, ...formatTask(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await listTasks({ page, perPage, additionalFilters: filter, include }, execCtx);

    const response = formatListResponse(result.data, formatTask, result.meta, {
      ...formatOptions,
      included: result.included,
    });

    if (result.resolved && Object.keys(result.resolved).length > 0) {
      return jsonResult({ ...response, _resolved: result.resolved });
    }
    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'tasks', VALID_ACTIONS));
}
