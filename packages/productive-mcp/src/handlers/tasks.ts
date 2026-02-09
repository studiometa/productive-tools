/**
 * Tasks resource handler
 */

import type { HandlerContext, TaskArgs, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatTask } from '../formatters.js';
import { getTaskHints } from '../hints.js';
import { inputErrorResult, jsonResult } from './utils.js';

/** Default includes for tasks */
const DEFAULT_TASK_INCLUDE = ['project', 'project.company'];
const VALID_ACTIONS = ['list', 'get', 'create', 'update'];

export async function handleTasks(
  action: string,
  args: TaskArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, title, project_id, task_list_id, description, assignee_id } = args;
  // Merge default includes with user-provided includes
  const include = userInclude?.length
    ? [...new Set([...DEFAULT_TASK_INCLUDE, ...userInclude])]
    : DEFAULT_TASK_INCLUDE;

  if (action === 'get') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('get'));
    const result = await api.getTask(id, { include });
    const formatted = formatTask(result.data, { ...formatOptions, included: result.included });

    // Add contextual hints unless disabled
    if (ctx.includeHints !== false) {
      const serviceId = result.data.relationships?.service?.data?.id;
      return jsonResult({
        ...formatted,
        _hints: getTaskHints(id, serviceId),
      });
    }

    return jsonResult(formatted);
  }

  if (action === 'create') {
    if (!title || !project_id || !task_list_id) {
      return inputErrorResult(
        ErrorMessages.missingRequiredFields('task', ['title', 'project_id', 'task_list_id']),
      );
    }
    const result = await api.createTask({
      title,
      project_id,
      task_list_id,
      assignee_id,
      description,
    });
    return jsonResult({ success: true, ...formatTask(result.data, formatOptions) });
  }

  if (action === 'update') {
    if (!id) return inputErrorResult(ErrorMessages.missingId('update'));
    const updateData: Parameters<typeof api.updateTask>[1] = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignee_id !== undefined) updateData.assignee_id = assignee_id;
    const result = await api.updateTask(id, updateData);
    return jsonResult({ success: true, ...formatTask(result.data, formatOptions) });
  }

  if (action === 'list') {
    const result = await api.getTasks({ filter, page, perPage, include });
    return jsonResult(
      formatListResponse(result.data, formatTask, result.meta, {
        ...formatOptions,
        included: result.included,
      }),
    );
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'tasks', VALID_ACTIONS));
}
