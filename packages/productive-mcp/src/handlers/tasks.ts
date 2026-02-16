/**
 * Tasks resource handler
 */

import type { HandlerContext, TaskArgs, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse, formatTask } from '../formatters.js';
import { getTaskHints } from '../hints.js';
import { resolveFilters, handleResolve, type ResolvableResourceType } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

/** Default includes for tasks */
const DEFAULT_TASK_INCLUDE = ['project', 'project.company'];
const VALID_ACTIONS = ['list', 'get', 'create', 'update', 'resolve'];

export async function handleTasks(
  action: string,
  args: TaskArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage, include: userInclude } = ctx;
  const { id, title, project_id, task_list_id, description, assignee_id, query, type } = args;
  // Merge default includes with user-provided includes
  const include = userInclude?.length
    ? [...new Set([...DEFAULT_TASK_INCLUDE, ...userInclude])]
    : DEFAULT_TASK_INCLUDE;

  // Handle resolve action
  if (action === 'resolve') {
    return handleResolve({ query, type, project_id }, ctx);
  }

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
    // Resolve any human-friendly identifiers in filters
    const { resolved: resolvedFilter, metadata } = filter
      ? await resolveFilters(api, filter)
      : { resolved: filter, metadata: {} };

    const result = await api.getTasks({ filter: resolvedFilter, page, perPage, include });
    const response = formatListResponse(result.data, formatTask, result.meta, {
      ...formatOptions,
      included: result.included,
    });

    // Include resolution metadata if any resolutions occurred
    if (Object.keys(metadata).length > 0) {
      return jsonResult({ ...response, _resolved: metadata });
    }

    return jsonResult(response);
  }

  return inputErrorResult(ErrorMessages.invalidAction(action, 'tasks', VALID_ACTIONS));
}
