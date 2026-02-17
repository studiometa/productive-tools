/**
 * Factory for creating resource handlers.
 *
 * Encapsulates the repetitive list/get/create/update/delete/resolve pattern
 * shared by all MCP resource handlers.
 */

import type { JsonApiResource } from '@studiometa/productive-api';
import type { ExecutorContext, ResolvedInfo } from '@studiometa/productive-core';

import type { McpFormatOptions } from '../formatters.js';
import type { ContextualHints } from '../hints.js';
import type { CommonArgs, HandlerContext, ToolResult } from './types.js';

import { ErrorMessages } from '../errors.js';
import { formatListResponse } from '../formatters.js';
import { handleResolve, type ResolvableResourceType } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

/**
 * Result type from executors (list operations)
 */
interface ListExecutorResult {
  data: JsonApiResource[];
  meta?: { total_count?: number; total_pages?: number; current_page?: number };
  included?: JsonApiResource[];
  resolved?: Record<string, ResolvedInfo>;
}

/**
 * Result type from executors (single resource operations)
 */
interface SingleExecutorResult {
  data: JsonApiResource;
  included?: JsonApiResource[];
}

/**
 * Configuration for the create action
 */
interface CreateConfig<TArgs> {
  /** Fields that must be present for create */
  required: (keyof TArgs)[];
  /** Custom validation (return error message or undefined if valid) */
  validate?: (args: TArgs) => string | undefined;
  /** Map args to executor options */
  mapOptions: (args: TArgs) => Record<string, unknown>;
}

/**
 * Configuration for the update action
 */
interface UpdateConfig<TArgs> {
  /** Map args to executor options (id is handled automatically) */
  mapOptions: (args: TArgs) => Record<string, unknown>;
}

/**
 * Configuration for a resource handler
 */
export interface ResourceHandlerConfig<TArgs extends CommonArgs = CommonArgs> {
  /** Resource name (e.g., 'projects', 'tasks') */
  resource: string;

  /** Valid actions for this resource */
  actions: string[];

  /** Formatter function for this resource */
  formatter: (item: JsonApiResource, options?: McpFormatOptions) => Record<string, unknown>;

  /** Optional hints generator for get action */
  hints?: (data: JsonApiResource, id: string) => ContextualHints;

  /** Default include for list/get operations */
  defaultInclude?: {
    list?: string[];
    get?: string[];
  };

  /** Whether this resource supports the resolve action */
  supportsResolve?: boolean;

  /** Create action configuration (if supported) */
  create?: CreateConfig<TArgs>;

  /** Update action configuration (if supported) */
  update?: UpdateConfig<TArgs>;

  /** Executors for each action */
  executors: {
    list: (
      options: {
        page?: number;
        perPage?: number;
        additionalFilters?: Record<string, string>;
        include?: string[];
      },
      ctx: ExecutorContext,
    ) => Promise<ListExecutorResult>;
    get?: (
      options: { id: string; include?: string[] },
      ctx: ExecutorContext,
    ) => Promise<SingleExecutorResult>;
    create?: (
      options: Record<string, unknown>,
      ctx: ExecutorContext,
    ) => Promise<SingleExecutorResult>;
    update?: (
      options: Record<string, unknown>,
      ctx: ExecutorContext,
    ) => Promise<SingleExecutorResult>;
    delete?: (options: { id: string }, ctx: ExecutorContext) => Promise<void>;
  };
}

/**
 * Merge user includes with defaults, ensuring no duplicates
 */
function mergeIncludes(userInclude?: string[], defaults?: string[]): string[] | undefined {
  if (!userInclude?.length && !defaults?.length) return undefined;
  if (!userInclude?.length) return defaults;
  if (!defaults?.length) return userInclude;
  return [...new Set([...defaults, ...userInclude])];
}

/**
 * Create a resource handler function from configuration.
 *
 * @example
 * ```typescript
 * export const handleProjects = createResourceHandler({
 *   resource: 'projects',
 *   actions: ['list', 'get', 'resolve'],
 *   formatter: formatProject,
 *   hints: (data, id) => getProjectHints(id),
 *   supportsResolve: true,
 *   executors: {
 *     list: listProjects,
 *     get: getProject,
 *   },
 * });
 * ```
 */
export function createResourceHandler<TArgs extends CommonArgs = CommonArgs>(
  config: ResourceHandlerConfig<TArgs>,
): (
  action: string,
  args: TArgs & { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
) => Promise<ToolResult> {
  const {
    resource,
    actions,
    formatter,
    hints,
    defaultInclude,
    supportsResolve,
    create: createConfig,
    update: updateConfig,
    executors,
  } = config;

  return async (
    action: string,
    args: TArgs & { query?: string; type?: ResolvableResourceType },
    ctx: HandlerContext,
  ): Promise<ToolResult> => {
    const { formatOptions, filter, page, perPage, include: userInclude } = ctx;
    const { id, query, type } = args;

    // Handle resolve action
    if (action === 'resolve') {
      if (!supportsResolve) {
        return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
      }
      return handleResolve({ query, type }, ctx);
    }

    const execCtx = ctx.executor();

    // Handle get action
    if (action === 'get') {
      if (!executors.get) {
        return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
      }
      if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

      const include = mergeIncludes(userInclude, defaultInclude?.get);
      const result = await executors.get({ id, include }, execCtx);
      const formatted = formatter(result.data, { ...formatOptions, included: result.included });

      if (ctx.includeHints !== false && hints) {
        return jsonResult({
          ...formatted,
          _hints: hints(result.data, id),
        });
      }

      return jsonResult(formatted);
    }

    // Handle create action
    if (action === 'create') {
      if (!executors.create || !createConfig) {
        return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
      }

      // Check required fields
      const missingFields = createConfig.required.filter((field) => !args[field]);
      if (missingFields.length > 0) {
        return inputErrorResult(
          ErrorMessages.missingRequiredFields(resource, missingFields as string[]),
        );
      }

      // Run custom validation if provided
      if (createConfig.validate) {
        const errorMessage = createConfig.validate(args);
        if (errorMessage) {
          return inputErrorResult(ErrorMessages.missingRequiredFields(resource, [errorMessage]));
        }
      }

      const options = createConfig.mapOptions(args);
      const result = await executors.create(options, execCtx);
      return jsonResult({ success: true, ...formatter(result.data, formatOptions) });
    }

    // Handle update action
    if (action === 'update') {
      if (!executors.update || !updateConfig) {
        return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
      }
      if (!id) return inputErrorResult(ErrorMessages.missingId('update'));

      const options = { id, ...updateConfig.mapOptions(args) };
      const result = await executors.update(options, execCtx);
      return jsonResult({ success: true, ...formatter(result.data, formatOptions) });
    }

    // Handle delete action
    if (action === 'delete') {
      if (!executors.delete) {
        return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
      }
      if (!id) return inputErrorResult(ErrorMessages.missingId('delete'));

      await executors.delete({ id }, execCtx);
      return jsonResult({ success: true, deleted: id });
    }

    // Handle list action
    if (action === 'list') {
      const include = mergeIncludes(userInclude, defaultInclude?.list);
      const result = await executors.list(
        { page, perPage, additionalFilters: filter, include },
        execCtx,
      );

      const response = formatListResponse(result.data, formatter, result.meta, {
        ...formatOptions,
        included: result.included,
      });

      // Include resolution metadata if any resolutions occurred
      if (result.resolved && Object.keys(result.resolved).length > 0) {
        return jsonResult({ ...response, _resolved: result.resolved });
      }

      return jsonResult(response);
    }

    // Invalid action
    return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
  };
}
