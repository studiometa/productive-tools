/**
 * Tasks resource handler
 */

import type { HandlerContext, TaskArgs, ToolResult } from './types.js';

import { formatTask, formatListResponse } from '../formatters.js';
import { jsonResult, errorResult } from './utils.js';

export async function handleTasks(
  action: string,
  args: TaskArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  const { api, formatOptions, filter, page, perPage } = ctx;
  const { id, title, project_id, task_list_id, description, assignee_id } = args;
  const include = ['project', 'project.company'];

  if (action === 'get') {
    if (!id) return errorResult('id is required for get action');
    const result = await api.getTask(id, { include });
    return jsonResult(formatTask(result.data, { ...formatOptions, included: result.included }));
  }

  if (action === 'create') {
    if (!title || !project_id || !task_list_id) {
      return errorResult('title, project_id, and task_list_id are required for create');
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
    if (!id) return errorResult('id is required for update action');
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

  return errorResult(`Invalid action "${action}" for tasks. Use: list, get, create, update`);
}
