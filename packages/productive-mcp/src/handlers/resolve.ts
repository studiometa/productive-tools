/**
 * Resolve handler for MCP.
 *
 * Thin wrapper around core's resource resolver.
 * Provides handleResolve for the MCP 'resolve' action.
 */

import { resolveResource, ResolveError, type ResolveResult } from '@studiometa/productive-core';

import type { HandlerContext, ToolResult } from './types.js';

import { UserInputError } from '../errors.js';
import { errorResult, inputErrorResult, jsonResult } from './utils.js';

// Re-export types used by MCP handlers
export type { ResolvableResourceType, ResolveResult } from '@studiometa/productive-core';

/**
 * Arguments for resolve action
 */
interface ResolveArgs {
  query?: string;
  type?: 'person' | 'project' | 'company' | 'deal' | 'service';
  project_id?: string;
}

/**
 * Handle resolve action for a resource.
 *
 * Delegates to core's resolveResource function and wraps
 * errors in MCP-friendly format.
 */
export async function handleResolve(args: ResolveArgs, ctx: HandlerContext): Promise<ToolResult> {
  const { query, type, project_id } = args;

  if (!query) {
    return errorResult('query is required for resolve action');
  }

  try {
    const execCtx = ctx.executor();
    const results: ResolveResult[] = await resolveResource(execCtx.api, query, {
      type,
      projectId: project_id,
    });

    return jsonResult({
      query,
      matches: results,
      exact: results.length === 1 && results[0].exact,
    });
  } catch (error) {
    if (error instanceof ResolveError) {
      return inputErrorResult(
        new UserInputError(error.message, [
          `Query: "${error.query}"`,
          ...(error.type ? [`Type: ${error.type}`] : []),
        ]),
      );
    }
    throw error;
  }
}
