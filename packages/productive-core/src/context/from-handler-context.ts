/**
 * Bridge from MCP HandlerContext to ExecutorContext.
 *
 * Creates an ExecutorContext that uses the core resource resolver.
 */

import type { ProductiveApi } from '@studiometa/productive-api';

import type { ExecutorContext } from './types.js';

import { createResourceResolver, type ResolverCache } from '../resolvers/index.js';

/**
 * Minimal interface for what we need from HandlerContext.
 */
export interface HandlerContextLike {
  api: ProductiveApi;
}

/**
 * Options for creating an executor context from a handler context.
 */
export interface FromHandlerContextOptions {
  /** Optional cache for the resource resolver */
  cache?: ResolverCache;
  /** Organization ID for cache keys */
  orgId?: string;
}

/**
 * Create an ExecutorContext from an MCP HandlerContext.
 *
 * Uses the core's createResourceResolver for ID resolution.
 *
 * @example
 * ```typescript
 * import { fromHandlerContext } from '@studiometa/productive-core';
 * import { listTimeEntries } from '@studiometa/productive-core';
 *
 * export async function handleTime(action, args, ctx) {
 *   if (action === 'list') {
 *     const execCtx = fromHandlerContext(ctx);
 *     const result = await listTimeEntries(options, execCtx);
 *     return jsonResult(formatListResponse(result.data, ...));
 *   }
 * }
 * ```
 */
export function fromHandlerContext(
  ctx: HandlerContextLike,
  options: FromHandlerContextOptions = {},
): ExecutorContext {
  return {
    api: ctx.api,
    resolver: createResourceResolver(ctx.api, {
      cache: options.cache,
      orgId: options.orgId,
    }),
    config: {
      organizationId: options.orgId ?? '',
    },
  };
}
