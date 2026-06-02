/**
 * Comments command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { commentsList, commentsGet, commentsAdd, commentsUpdate } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const commentsCommandConfig: CommandRouterConfig = {
  resource: 'comments',
  handlers: {
    list: commentsList,
    ls: commentsList,
    get: [commentsGet, 'args'],
    add: commentsAdd,
    create: commentsAdd,
    update: [commentsUpdate, 'args'],
  },
};

/**
 * Handle comments command
 */
export const handleCommentsCommand = createCommandRouter(commentsCommandConfig);
