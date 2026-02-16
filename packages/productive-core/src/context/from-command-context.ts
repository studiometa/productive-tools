/**
 * Bridge from CLI CommandContext to ExecutorContext.
 *
 * Creates an ExecutorContext that delegates to the CLI's existing
 * resolver and API instances, allowing executors to be used
 * from CLI command handlers.
 */

import type { ProductiveApi } from '@studiometa/productive-cli';

import type { ExecutorContext, ResourceResolver, ResolvableResourceType } from './types.js';

/**
 * Minimal interface for what we need from CommandContext.
 * Uses ProductiveApi directly for type compatibility.
 */
export interface CommandContextLike {
  api: ProductiveApi;
  config: { userId?: string; organizationId?: string };
  resolveFilters(
    filters: Record<string, string>,
    typeMapping?: Record<string, string>,
  ): Promise<{
    resolved: Record<string, string>;
    metadata: Record<string, unknown>;
    didResolve?: boolean;
  }>;
  tryResolveValue(value: string, type: string, options?: { projectId?: string }): Promise<string>;
}

/**
 * Create a ResourceResolver that delegates to CommandContext methods.
 */
function createResolverFromCommandContext(ctx: CommandContextLike): ResourceResolver {
  return {
    async resolveValue(
      value: string,
      type: ResolvableResourceType,
      options?: { projectId?: string },
    ): Promise<string> {
      return ctx.tryResolveValue(value, type, options);
    },

    async resolveFilters(
      filters: Record<string, string>,
      typeMapping?: Record<string, ResolvableResourceType>,
    ): Promise<{
      resolved: Record<string, string>;
      metadata: Record<string, never>;
    }> {
      const result = await ctx.resolveFilters(filters, typeMapping);
      return {
        resolved: result.resolved,
        metadata: result.metadata as Record<string, never>,
      };
    },
  };
}

/**
 * Create an ExecutorContext from a CLI CommandContext.
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
export function fromCommandContext(ctx: CommandContextLike): ExecutorContext {
  return {
    api: ctx.api,
    resolver: createResolverFromCommandContext(ctx),
    config: {
      userId: ctx.config.userId,
      organizationId: ctx.config.organizationId ?? '',
    },
  };
}
