/**
 * Projects MCP handler.
 *
 * Uses the createResourceHandler factory for the common list/get/resolve pattern.
 */

import { listProjects, getProject } from '@studiometa/productive-core';

import type { CommonArgs } from './types.js';

import { formatProject } from '../formatters.js';
import { getProjectHints } from '../hints.js';
import { createResourceHandler } from './factory.js';

/**
 * Handle projects resource.
 *
 * Supports: list, get, resolve
 */
export const handleProjects = createResourceHandler<CommonArgs>({
  resource: 'projects',
  actions: ['list', 'get', 'resolve'],
  formatter: formatProject,
  hints: (_data, id) => getProjectHints(id),
  supportsResolve: true,
  executors: {
    list: listProjects,
    get: getProject,
  },
});
