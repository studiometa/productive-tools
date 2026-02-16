/**
 * Helper function to resolve human-friendly identifiers in command filters.
 *
 * This module provides a convenience function for command handlers to
 * automatically resolve email addresses, project numbers, and other
 * human-friendly identifiers to numeric IDs.
 *
 * @example
 * ```typescript
 * // In a command handler:
 * const filter: Record<string, string> = {};
 * if (ctx.options.assignee) {
 *   filter.assignee_id = String(ctx.options.assignee);
 * }
 * if (ctx.options.project) {
 *   filter.project_id = String(ctx.options.project);
 * }
 *
 * // Resolve any human-friendly identifiers
 * const { resolved, metadata } = await resolveCommandFilters(ctx, filter, {
 *   assignee_id: 'person',
 *   project_id: 'project',
 * });
 *
 * // Use resolved filters in API call
 * const response = await ctx.api.getTasks({ filter: resolved });
 * ```
 */

import type { ResolvableResourceType, ResolvedMetadata } from '@studiometa/productive-core';

import { resolveFilterIds, needsResolution, ResolveError } from '@studiometa/productive-core';

import type { CommandContext } from '../context.js';

import { colors } from './colors.js';

/**
 * Filter type mapping for common filter names
 */
export const COMMON_FILTER_TYPES: Record<string, ResolvableResourceType> = {
  // Person filters
  person_id: 'person',
  assignee_id: 'person',
  creator_id: 'person',
  responsible_id: 'person',

  // Project filters
  project_id: 'project',

  // Company filters
  company_id: 'company',

  // Deal filters
  deal_id: 'deal',

  // Service filters (note: may need project context)
  service_id: 'service',
};

/**
 * Result of filter resolution
 */
export interface ResolveCommandFiltersResult {
  /** Resolved filter values (IDs) */
  resolved: Record<string, string>;
  /** Metadata about resolutions performed */
  metadata: ResolvedMetadata;
  /** Whether any resolution was performed */
  didResolve: boolean;
}

/**
 * Options for filter resolution
 */
export interface ResolveCommandFiltersOptions {
  /** Show spinner message during resolution */
  spinnerMessage?: string;
  /** Project ID context for service resolution */
  projectId?: string;
  /** Whether to show resolution info in human output */
  showResolutionInfo?: boolean;
}

/**
 * Resolve human-friendly identifiers in command filters.
 *
 * This function takes a filter object and a type mapping, and resolves
 * any non-numeric filter values to their corresponding IDs.
 *
 * @param ctx - Command context
 * @param filters - Filter object with potential human-friendly values
 * @param typeMapping - Mapping of filter keys to resource types (optional, uses COMMON_FILTER_TYPES)
 * @param options - Resolution options
 * @returns Object with resolved filters and metadata
 */
export async function resolveCommandFilters(
  ctx: CommandContext,
  filters: Record<string, string>,
  typeMapping: Record<string, ResolvableResourceType> = COMMON_FILTER_TYPES,
  options: ResolveCommandFiltersOptions = {},
): Promise<ResolveCommandFiltersResult> {
  // Check if any filters need resolution
  const filtersToResolve = Object.entries(filters).filter(
    ([key, value]) => typeMapping[key] && needsResolution(value),
  );

  if (filtersToResolve.length === 0) {
    return {
      resolved: filters,
      metadata: {},
      didResolve: false,
    };
  }

  // Resolve filters
  const { resolved, metadata } = await resolveFilterIds(ctx.api, filters, typeMapping, {
    projectId: options.projectId || (filters.project_id as string),
    first: true, // Always use first match for filter resolution
  });

  // Show resolution info in human output if enabled
  if (options.showResolutionInfo && Object.keys(metadata).length > 0) {
    const format = ctx.options.format || ctx.options.f || 'human';
    if (format === 'human') {
      for (const [key, info] of Object.entries(metadata)) {
        console.log(colors.dim(`Resolved ${key}: ${info.input} → ${info.label} (${info.id})`));
      }
    }
  }

  return {
    resolved,
    metadata,
    didResolve: Object.keys(metadata).length > 0,
  };
}

/**
 * Resolve a single filter value.
 *
 * Convenience function for resolving a single value when you don't need
 * the full filter resolution machinery.
 *
 * @param ctx - Command context
 * @param value - Value to resolve (may be numeric ID or human-friendly identifier)
 * @param type - Resource type to resolve to
 * @param options - Resolution options
 * @returns Resolved ID
 * @throws ResolveError if resolution fails
 */
export async function resolveValue(
  ctx: CommandContext,
  value: string,
  type: ResolvableResourceType,
  options: { projectId?: string } = {},
): Promise<string> {
  if (!needsResolution(value)) {
    return value;
  }

  const { resolved } = await resolveFilterIds(
    ctx.api,
    { value },
    { value: type },
    {
      projectId: options.projectId,
      first: true,
    },
  );

  if (resolved.value === value) {
    // Resolution failed, value unchanged
    throw new ResolveError(`Could not resolve ${type}: "${value}"`, value, type);
  }

  return resolved.value;
}

/**
 * Try to resolve a value, returning the original on failure.
 *
 * Like resolveValue but doesn't throw - returns original value if resolution fails.
 *
 * @param ctx - Command context
 * @param value - Value to resolve
 * @param type - Resource type
 * @param options - Resolution options
 * @returns Resolved ID or original value
 */
export async function tryResolveValue(
  ctx: CommandContext,
  value: string,
  type: ResolvableResourceType,
  options: { projectId?: string } = {},
): Promise<string> {
  try {
    return await resolveValue(ctx, value, type, options);
  } catch {
    return value;
  }
}
