/**
 * Comments MCP handler.
 */

import {
  listComments,
  getComment,
  createComment,
  updateComment,
} from '@studiometa/productive-core';

import type { CommentArgs } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatComment } from '../formatters.js';
import { getCommentHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { inputErrorResult } from './utils.js';

export const handleComments = createResourceHandler<CommentArgs>({
  resource: 'comments',
  actions: ['list', 'get', 'create', 'update'],
  formatter: formatComment,
  hints: (data, id) => {
    const commentableType = data.attributes?.commentable_type as string | undefined;
    let commentableId: string | undefined;
    if (commentableType === 'task') {
      commentableId = data.relationships?.task?.data?.id;
    } else if (commentableType === 'deal') {
      commentableId = data.relationships?.deal?.data?.id;
    } else if (commentableType === 'company') {
      commentableId = data.relationships?.company?.data?.id;
    }
    return getCommentHints(id, commentableType, commentableId);
  },
  defaultInclude: {
    list: ['creator'],
    get: ['creator'],
  },
  create: {
    required: ['body'],
    validateArgs: (args) => {
      if (!args.task_id && !args.deal_id && !args.company_id) {
        return inputErrorResult(ErrorMessages.missingCommentTarget());
      }
      return undefined;
    },
    mapOptions: (args) => ({
      body: args.body,
      taskId: args.task_id,
      dealId: args.deal_id,
      companyId: args.company_id,
    }),
  },
  update: {
    allowedFields: ['body'],
    mapOptions: (args) => ({ body: args.body }),
  },
  executors: {
    list: listComments,
    get: getComment,
    create: createComment,
    update: updateComment,
  },
});
