/**
 * Bridge from CLI CommandContext to ExecutorContext.
 *
 * Creates an ExecutorContext that uses the core resource resolver,
 * optionally with a cache provided by the CLI.
 */

import type { ProductiveApi } from '@studiometa/productive-api';

import type { ExecutorContext } from './types.js';

import { createResourceResolver, type ResolverCache } from '../resolvers/index.js';

/**
 * Minimal interface for what we need from CommandContext.
 */
export interface CommandContextLike {
  api: ProductiveApi;
  config: { userId?: string; organizationId?: string };
}

/**
 * Options for creating an executor context from a command context.
 */
export interface FromCommandContextOptions {
  /** Optional cache for the resource resolver */
  cache?: ResolverCache;
}

/**
 * Create an ExecutorContext from a CLI CommandContext.
 *
 * Uses the core's createResourceResolver for ID resolution,
 * with optional cache injection from the CLI layer.
 *
 * @example
 * ```typescript
 * import { fromCommandContext } from '@studiometa/productive-core';
 * import { listTimeEntries } from '@studiometa/productive-core';
 *
 * export async function timeList(ctx: CommandContext): Promise<void> {
 *   const execCtx = fromCommandContext(ctx);
 *   const result = await listTimeEntries(options, execCtx);
 *   // ... handle output
 * }
 * ```
 */
export function fromCommandContext(
  ctx: CommandContextLike,
  options: FromCommandContextOptions = {},
): ExecutorContext {
  const orgId = ctx.config.organizationId ?? '';

  return {
    api: ctx.api,
    resolver: createResourceResolver(ctx.api, {
      cache: options.cache,
      orgId,
    }),
    config: {
      userId: ctx.config.userId,
      organizationId: orgId,
    },
  };
}
