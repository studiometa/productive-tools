/**
 * Bridge from MCP HandlerContext to ExecutorContext.
 *
 * Creates an ExecutorContext that delegates to the MCP handler's existing
 * API instance and resolve functions, allowing executors to be used
 * from MCP handlers.
 */

import type { ProductiveApi } from '@studiometa/productive-cli';

import type { ExecutorContext, ResourceResolver, ResolvableResourceType } from './types.js';

/**
 * Minimal interface for what we need from HandlerContext.
 * Uses ProductiveApi directly for type compatibility.
 */
export interface HandlerContextLike {
  api: ProductiveApi;
}

/**
 * Interface for the MCP resolve module functions.
 * These are passed separately because they're not on HandlerContext.
 */
export interface McpResolveFunctions {
  resolveFilterValue(
    api: ProductiveApi,
    value: string,
    type: string,
    projectId?: string,
  ): Promise<string>;
  resolveFilters(
    api: ProductiveApi,
    filters: Record<string, string>,
    projectId?: string,
  ): Promise<{
    resolved: Record<string, string>;
    metadata: Record<string, unknown>;
  }>;
  isNumericId(value: string): boolean;
}

/**
 * Create a ResourceResolver that delegates to MCP resolve functions.
 */
function createResolverFromMcpContext(
  api: ProductiveApi,
  resolveFns: McpResolveFunctions,
): ResourceResolver {
  return {
    async resolveValue(
      value: string,
      type: ResolvableResourceType,
      options?: { projectId?: string },
    ): Promise<string> {
      if (resolveFns.isNumericId(value)) return value;
      return resolveFns.resolveFilterValue(api, value, type, options?.projectId);
    },

    async resolveFilters(filters: Record<string, string>): Promise<{
      resolved: Record<string, string>;
      metadata: Record<string, never>;
    }> {
      const result = await resolveFns.resolveFilters(api, filters);
      return {
        resolved: result.resolved,
        metadata: result.metadata as Record<string, never>,
      };
    },
  };
}

/**
 * Create an ExecutorContext from an MCP HandlerContext.
 *
 * @param ctx - The MCP HandlerContext
 * @param resolveFns - Resolve functions from the MCP resolve module
 *
 * @example
 * ```typescript
 * import { fromHandlerContext } from '@studiometa/productive-core';
 * import { listTimeEntries } from '@studiometa/productive-core';
 * import * as resolve from './resolve.js';
 *
 * export async function handleTime(action, args, ctx) {
 *   if (action === 'list') {
 *     const execCtx = fromHandlerContext(ctx, resolve);
 *     const result = await listTimeEntries(options, execCtx);
 *     return jsonResult(formatListResponse(result.data, ...));
 *   }
 * }
 * ```
 */
export function fromHandlerContext(
  ctx: HandlerContextLike,
  resolveFns: McpResolveFunctions,
): ExecutorContext {
  return {
    api: ctx.api,
    resolver: createResolverFromMcpContext(ctx.api, resolveFns),
    config: {
      organizationId: '',
    },
  };
}
