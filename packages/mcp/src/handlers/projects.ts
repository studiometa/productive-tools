/**
 * Projects MCP handler.
 *
 * Uses the createResourceHandler factory for the common list/get/resolve pattern.
 */

import { listProjects, getProject, getProjectContext } from '@studiometa/productive-core';

import type { CommonArgs } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatProject, formatTask, formatService, formatTimeEntry } from '../formatters.js';
import { getProjectHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { inputErrorResult, jsonResult } from './utils.js';

/**
 * Handle projects resource.
 *
 * Supports: list, get, resolve, context
 */
export const handleProjects = createResourceHandler<CommonArgs>({
  resource: 'projects',
  actions: ['list', 'get', 'resolve', 'context'],
  formatter: formatProject,
  hints: (_data, id) => getProjectHints(id),
  supportsResolve: true,
  customActions: {
    context: async (args, ctx, execCtx) => {
      if (!args.id) return inputErrorResult(ErrorMessages.missingId('context'));
      const result = await getProjectContext({ id: args.id }, execCtx);
      const formatOptions = { ...ctx.formatOptions, included: result.included };

      return jsonResult({
        ...formatProject(result.data.project, ctx.formatOptions),
        tasks: result.data.tasks.map((t) => formatTask(t, { ...formatOptions, compact: true })),
        services: result.data.services.map((s) => formatService(s, { compact: true })),
        time_entries: result.data.time_entries.map((t) => formatTimeEntry(t, { compact: true })),
      });
    },
  },
  executors: {
    list: listProjects,
    get: getProject,
  },
});
