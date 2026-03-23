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

import { ErrorMessages, UserInputError } from '../errors.js';
import { formatTimeEntry } from '../formatters.js';
import { getTimeEntryHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { inputErrorResult, jsonResult } from './utils.js';

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
  customActions: {
    create: async (args, ctx, execCtx) => {
      // Validate required fields (person_id is optional — defaults to current user)
      const missingFields = (['service_id', 'time', 'date'] as (keyof TimeArgs)[]).filter(
        (field) => !args[field],
      );
      if (missingFields.length > 0) {
        return inputErrorResult(
          ErrorMessages.missingRequiredFields('time entry', missingFields as string[]),
        );
      }

      // Default person_id to the current user when not provided
      const personId = args.person_id ?? execCtx.config.userId;
      if (!personId) {
        return inputErrorResult(
          new UserInputError(
            'person_id is required (could not auto-resolve: userId not configured)',
            ['Provide person_id explicitly', 'Or configure userId in your credentials'],
          ),
        );
      }

      const result = await createTimeEntry(
        {
          personId,
          serviceId: args.service_id as string,
          time: args.time as number,
          date: args.date as string,
          note: args.note ?? undefined,
          taskId: args.task_id,
          projectId: args.project_id,
        },
        execCtx,
      );

      return jsonResult({ success: true, ...formatTimeEntry(result.data, ctx.formatOptions) });
    },
  },
  update: {
    mapOptions: (args) => ({
      time: args.time ?? undefined,
      billable_time: args.billable_time ?? undefined,
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
