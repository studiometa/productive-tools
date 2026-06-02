/**
 * Discussions command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import {
  discussionsList,
  discussionsGet,
  discussionsAdd,
  discussionsUpdate,
  discussionsDelete,
  discussionsResolve,
  discussionsReopen,
} from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const discussionsCommandConfig: CommandRouterConfig = {
  resource: 'discussions',
  handlers: {
    list: discussionsList,
    ls: discussionsList,
    get: [discussionsGet, 'args'],
    add: discussionsAdd,
    create: discussionsAdd,
    update: [discussionsUpdate, 'args'],
    delete: [discussionsDelete, 'args'],
    rm: [discussionsDelete, 'args'],
    resolve: [discussionsResolve, 'args'],
    reopen: [discussionsReopen, 'args'],
  },
};

/**
 * Handle discussions command
 */
export const handleDiscussionsCommand = createCommandRouter(discussionsCommandConfig);
