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
import {
  getTaskGetSuggestions,
  getTaskListSuggestions,
  getTimeListSuggestions,
} from '../suggestions.js';
import { handleResolve, type ResolvableResourceType } from './resolve.js';
import { inputErrorResult, jsonResult } from './utils.js';

// Re-export for use in customActions
export type { ExecutorContext };

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
  /** Custom validation that returns a ToolResult on error, or undefined if valid */
  validateArgs?: (args: TArgs) => ToolResult | undefined;
  /** Map args to executor options */
  mapOptions: (args: TArgs) => Record<string, unknown>;
}

/**
 * Configuration for the update action
 */
interface UpdateConfig<TArgs> {
  /** Fields that can be updated - if none provided, error is returned */
  allowedFields?: (keyof TArgs)[];
  /** Map args to executor options (id is handled automatically) */
  mapOptions: (args: TArgs) => Record<string, unknown>;
}

/**
 * Configuration for a resource handler
 */
export interface ResourceHandlerConfig<TArgs extends CommonArgs = CommonArgs> {
  /** Resource name (e.g., 'projects', 'tasks') */
  resource: string;

  /** Display name for error messages (defaults to resource) */
  displayName?: string;

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

  /** Extract additional filters from args for list operations */
  listFilterFromArgs?: (args: TArgs) => Record<string, string>;

  /** Extract extra args to pass to handleResolve (e.g., project_id for tasks/time) */
  resolveArgsFromArgs?: (args: TArgs) => Record<string, string | undefined>;

  /** Custom action handlers for non-CRUD actions (e.g., resolve/reopen for discussions, start/stop for timers) */
  customActions?: Record<
    string,
    (args: TArgs, ctx: HandlerContext, execCtx: ExecutorContext) => Promise<ToolResult>
  >;

  /** Create action configuration (if supported) */
  create?: CreateConfig<TArgs>;

  /** Update action configuration (if supported) */
  update?: UpdateConfig<TArgs>;

  /** Executors for each action */
  executors: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    list: (options: any, ctx: ExecutorContext) => Promise<ListExecutorResult>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get?: (options: any, ctx: ExecutorContext) => Promise<SingleExecutorResult>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create?: (options: any, ctx: ExecutorContext) => Promise<SingleExecutorResult>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update?: (options: any, ctx: ExecutorContext) => Promise<SingleExecutorResult>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete?: (options: any, ctx: ExecutorContext) => Promise<unknown>;
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
    displayName = resource,
    actions,
    formatter,
    hints,
    defaultInclude,
    supportsResolve,
    listFilterFromArgs,
    resolveArgsFromArgs,
    customActions,
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

    const execCtx = ctx.executor();

    // Handle custom actions first (before built-in resolve, to allow overriding)
    if (customActions?.[action]) {
      return customActions[action](args, ctx, execCtx);
    }

    // Handle resolve action (for query resolution, not domain-specific resolve)
    if (action === 'resolve') {
      if (!supportsResolve) {
        return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
      }
      return handleResolve({ query, type, ...resolveArgsFromArgs?.(args) }, ctx);
    }

    // Handle get action
    if (action === 'get') {
      if (!executors.get) {
        return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
      }
      if (!id) return inputErrorResult(ErrorMessages.missingId('get'));

      const include = mergeIncludes(userInclude, defaultInclude?.get);
      const result = await executors.get({ id, include }, execCtx);
      const formatted = formatter(result.data, { ...formatOptions, included: result.included });

      const getResponseData: Record<string, unknown> = { ...formatted };

      if (ctx.includeHints) {
        if (hints) {
          getResponseData._hints = hints(result.data, id);
        }
      }

      // Add resource-specific suggestions (controlled separately from hints)
      if (ctx.includeSuggestions !== false) {
        let getSuggestions: string[] = [];
        if (resource === 'tasks') {
          getSuggestions = getTaskGetSuggestions(result.data, result.included);
        }
        if (getSuggestions.length > 0) {
          getResponseData._suggestions = getSuggestions;
        }
      }

      return jsonResult(getResponseData);
    }

    // Handle create action
    if (action === 'create') {
      if (!executors.create || !createConfig) {
        return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
      }

      // Check required fields first
      const missingFields = createConfig.required.filter((field) => !args[field]);
      if (missingFields.length > 0) {
        return inputErrorResult(
          ErrorMessages.missingRequiredFields(displayName, missingFields as string[]),
        );
      }

      // Run custom args validation if provided (returns ToolResult on error)
      if (createConfig.validateArgs) {
        const errorResult = createConfig.validateArgs(args);
        if (errorResult) return errorResult;
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

      // Validate at least one allowed field is provided
      if (updateConfig.allowedFields && updateConfig.allowedFields.length > 0) {
        const hasAnyField = updateConfig.allowedFields.some((field) => args[field] !== undefined);
        if (!hasAnyField) {
          return inputErrorResult(
            ErrorMessages.noUpdateFieldsSpecified(updateConfig.allowedFields as string[]),
          );
        }
      }

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
      const additionalFilters = {
        ...filter,
        ...listFilterFromArgs?.(args),
      };
      const result = await executors.list({ page, perPage, additionalFilters, include }, execCtx);

      const response = formatListResponse(result.data, formatter, result.meta, {
        ...formatOptions,
        included: result.included,
      });

      const listResponseData: Record<string, unknown> = { ...response };

      // Include resolution metadata if any resolutions occurred
      if (result.resolved && Object.keys(result.resolved).length > 0) {
        listResponseData._resolved = result.resolved;
      }

      // Add resource-specific suggestions
      if (ctx.includeSuggestions !== false) {
        let listSuggestions: string[] = [];
        if (resource === 'tasks') {
          listSuggestions = getTaskListSuggestions(result.data);
        } else if (resource === 'time') {
          listSuggestions = getTimeListSuggestions(result.data, additionalFilters);
        }
        if (listSuggestions.length > 0) {
          listResponseData._suggestions = listSuggestions;
        }
      }

      return jsonResult(listResponseData);
    }

    // Invalid action
    return inputErrorResult(ErrorMessages.invalidAction(action, resource, actions));
  };
}
