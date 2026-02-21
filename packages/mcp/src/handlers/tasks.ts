/**
 * Tasks MCP handler.
 */

import {
  listTasks,
  getTask,
  getTaskContext,
  createTask,
  updateTask,
} from '@studiometa/productive-core';

import type { TaskArgs } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatTask, formatComment, formatTimeEntry } from '../formatters.js';
import { getTaskHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { inputErrorResult, jsonResult } from './utils.js';

export const handleTasks = createResourceHandler<TaskArgs>({
  resource: 'tasks',
  displayName: 'task',
  actions: ['list', 'get', 'create', 'update', 'resolve', 'context'],
  formatter: formatTask,
  hints: (data, id) => {
    const serviceId = data.relationships?.service?.data?.id;
    return getTaskHints(id, serviceId);
  },
  supportsResolve: true,
  resolveArgsFromArgs: (args) => ({ project_id: args.project_id }),
  defaultInclude: {
    list: ['project', 'project.company'],
    get: ['project', 'project.company'],
  },
  create: {
    required: ['title', 'project_id', 'task_list_id'],
    mapOptions: (args) => ({
      title: args.title,
      projectId: args.project_id,
      taskListId: args.task_list_id,
      assigneeId: args.assignee_id,
      description: args.description,
    }),
  },
  update: {
    mapOptions: (args) => ({
      title: args.title,
      description: args.description,
      assigneeId: args.assignee_id,
    }),
  },
  customActions: {
    context: async (args, ctx, execCtx) => {
      if (!args.id) return inputErrorResult(ErrorMessages.missingId('context'));
      const result = await getTaskContext({ id: args.id }, execCtx);
      const formatOptions = { ...ctx.formatOptions, included: result.included };

      return jsonResult({
        ...formatTask(result.data.task, formatOptions),
        comments: result.data.comments.map((c) => formatComment(c, { compact: true })),
        time_entries: result.data.time_entries.map((t) => formatTimeEntry(t, { compact: true })),
        subtasks: result.data.subtasks.map((s) =>
          formatTask(s, { ...formatOptions, compact: true }),
        ),
      });
    },
  },
  executors: {
    list: listTasks,
    get: getTask,
    create: createTask,
    update: updateTask,
  },
});
