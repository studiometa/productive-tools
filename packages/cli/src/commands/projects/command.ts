/**
 * Projects command entry point
 *
 * Handles command routing and dispatches to appropriate handlers.
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { projectsList, projectsGet } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const projectsCommandConfig: CommandRouterConfig = {
  resource: 'projects',
  handlers: {
    list: projectsList,
    ls: projectsList,
    get: [projectsGet, 'args'],
  },
};

/**
 * Handle projects command
 */
export const handleProjectsCommand = createCommandRouter(projectsCommandConfig);
