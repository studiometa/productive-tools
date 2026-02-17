/**
 * Time entries MCP handler.
 *
 * Thin adapter that delegates business logic to core executors
 * and handles MCP-specific concerns (hints, error formatting, JSON results).
 */

import {
  listTimeEntries,
  getTimeEntry,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from '@studiometa/productive-core';

import type { TimeArgs } from './types.js';

import { formatTimeEntry } from '../formatters.js';
import { getTimeEntryHints } from '../hints.js';
import { createResourceHandler } from './factory.js';

export const handleTime = createResourceHandler<TimeArgs>({
  resource: 'time',
  displayName: 'time entry',
  actions: ['list', 'get', 'create', 'update', 'delete', 'resolve'],
  formatter: formatTimeEntry,
  hints: (data, id) => {
    const serviceId = data.relationships?.service?.data?.id;
    return getTimeEntryHints(id, undefined, serviceId);
  },
  supportsResolve: true,
  resolveArgsFromArgs: (args) => ({ project_id: args.project_id }),
  create: {
    required: ['person_id', 'service_id', 'time', 'date'],
    mapOptions: (args) => ({
      personId: args.person_id,
      serviceId: args.service_id,
      time: args.time,
      date: args.date,
      note: args.note ?? undefined,
      taskId: args.task_id,
      projectId: args.project_id,
    }),
  },
  update: {
    mapOptions: (args) => ({
      time: args.time ?? undefined,
      date: args.date ?? undefined,
      note: args.note ?? undefined,
    }),
  },
  executors: {
    list: listTimeEntries,
    get: getTimeEntry,
    create: createTimeEntry,
    update: updateTimeEntry,
    delete: deleteTimeEntry,
  },
});
