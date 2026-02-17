/**
 * Discussions MCP handler.
 */

import {
  listDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  resolveDiscussion,
  reopenDiscussion,
} from '@studiometa/productive-core';

import type { DiscussionArgs } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatDiscussion } from '../formatters.js';
import { getDiscussionHints } from '../hints.js';
import { createResourceHandler } from './factory.js';
import { inputErrorResult, jsonResult } from './utils.js';

// Status mapping for discussion list filter
const STATUS_MAP: Record<string, string> = {
  active: '1',
  resolved: '2',
};

export const handleDiscussions = createResourceHandler<DiscussionArgs>({
  resource: 'discussions',
  actions: ['list', 'get', 'create', 'update', 'delete', 'resolve', 'reopen'],
  formatter: formatDiscussion,
  hints: (data, id) => {
    const pageId = data.relationships?.page?.data?.id;
    return getDiscussionHints(id, pageId);
  },
  listFilterFromArgs: (args) => {
    const filters: Record<string, string> = {};
    if (args.status) {
      // Map user-friendly status to API value
      const mapped = STATUS_MAP[args.status.toLowerCase()];
      if (mapped) filters.status = mapped;
    }
    return filters;
  },
  create: {
    required: ['body', 'page_id'],
    mapOptions: (args) => ({
      body: args.body,
      pageId: args.page_id,
      title: args.title,
    }),
  },
  update: {
    mapOptions: (args) => ({ title: args.title, body: args.body }),
  },
  customActions: {
    resolve: async (args, ctx, execCtx) => {
      if (!args.id) return inputErrorResult(ErrorMessages.missingId('resolve'));
      const result = await resolveDiscussion({ id: args.id }, execCtx);
      return jsonResult({ success: true, ...formatDiscussion(result.data, ctx.formatOptions) });
    },
    reopen: async (args, ctx, execCtx) => {
      if (!args.id) return inputErrorResult(ErrorMessages.missingId('reopen'));
      const result = await reopenDiscussion({ id: args.id }, execCtx);
      return jsonResult({ success: true, ...formatDiscussion(result.data, ctx.formatOptions) });
    },
  },
  executors: {
    list: listDiscussions,
    get: getDiscussion,
    create: createDiscussion,
    update: updateDiscussion,
    delete: deleteDiscussion,
  },
});
