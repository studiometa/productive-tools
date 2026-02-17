/**
 * Tasks MCP handler.
 */

import { listTasks, getTask, createTask, updateTask } from '@studiometa/productive-core';

import type { TaskArgs } from './types.js';

import { formatTask } from '../formatters.js';
import { getTaskHints } from '../hints.js';
import { createResourceHandler } from './factory.js';

export const handleTasks = createResourceHandler<TaskArgs>({
  resource: 'tasks',
  displayName: 'task',
  actions: ['list', 'get', 'create', 'update', 'resolve'],
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
  executors: {
    list: listTasks,
    get: getTask,
    create: createTask,
    update: updateTask,
  },
});
