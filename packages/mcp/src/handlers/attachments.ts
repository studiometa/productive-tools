/**
 * Attachments MCP handler.
 */

import { listAttachments, getAttachment, deleteAttachment } from '@studiometa/productive-core';

import type { AttachmentArgs } from './types.js';

import { formatAttachment } from '../formatters.js';
import { getAttachmentHints } from '../hints.js';
import { createResourceHandler } from './factory.js';

export const handleAttachments = createResourceHandler<AttachmentArgs>({
  resource: 'attachments',
  actions: ['list', 'get', 'delete'],
  formatter: formatAttachment,
  hints: (data, id) => {
    const attachableType = data.attributes?.attachable_type as string | undefined;
    return getAttachmentHints(id, attachableType);
  },
  listFilterFromArgs: (args) => {
    const filters: Record<string, string> = {};
    if (args.task_id) filters.task_id = args.task_id;
    if (args.comment_id) filters.comment_id = args.comment_id;
    if (args.deal_id) filters.deal_id = args.deal_id;
    return filters;
  },
  executors: {
    list: listAttachments,
    get: getAttachment,
    delete: deleteAttachment,
  },
});
