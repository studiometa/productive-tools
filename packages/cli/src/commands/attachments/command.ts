/**
 * Attachments command entry point
 */

import type { CommandRouterConfig } from '../../utils/command-router.js';

import { createCommandRouter } from '../../utils/command-router.js';
import { attachmentsList, attachmentsGet, attachmentsDelete } from './handlers.js';

/**
 * Router configuration — exported for testability
 */
export const attachmentsCommandConfig: CommandRouterConfig = {
  resource: 'attachments',
  handlers: {
    list: attachmentsList,
    ls: attachmentsList,
    get: [attachmentsGet, 'args'],
    delete: [attachmentsDelete, 'args'],
    rm: [attachmentsDelete, 'args'],
  },
};

/**
 * Handle attachments command
 */
export const handleAttachmentsCommand = createCommandRouter(attachmentsCommandConfig);
