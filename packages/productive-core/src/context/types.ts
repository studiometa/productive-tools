/**
 * ExecutorContext — injectable dependencies for executor functions.
 *
 * This is the core abstraction that makes executors testable:
 * inject real implementations in production, mocks in tests.
 */

import type { ProductiveApi } from '@studiometa/productive-api';

/**
 * Supported resource types for smart ID resolution
 */
export type ResolvableResourceType = 'person' | 'project' | 'company' | 'deal' | 'service';

/**
 * Result of resolving a human-friendly identifier to a numeric ID
 */
export interface ResolvedInfo {
  /** Original query string */
  query: string;
  /** Resolved numeric ID */
  id: string;
  /** Human-readable label for the resolved resource */
  label: string;
  /** Resource type */
  type: ResolvableResourceType;
}

/**
 * Resource resolver interface — resolves human-friendly identifiers
 * (emails, project numbers, names) to numeric IDs.
 */
export interface ResourceResolver {
  /**
   * Resolve a single value for a given resource type.
   * Returns the original value if resolution fails or value is already a numeric ID.
   */
  resolveValue(
    value: string,
    type: ResolvableResourceType,
    options?: { projectId?: string },
  ): Promise<string>;

  /**
   * Resolve all human-friendly identifiers in a filter object.
   * Returns the resolved filters and metadata about what was resolved.
   */
  resolveFilters(
    filters: Record<string, string>,
    typeMapping?: Record<string, ResolvableResourceType>,
  ): Promise<{
    resolved: Record<string, string>;
    metadata: Record<string, ResolvedInfo>;
  }>;
}

/**
 * Minimal config needed by executors
 */
export interface ExecutorConfig {
  userId?: string;
  organizationId: string;
}

/**
 * Context passed to all executor functions.
 *
 * Contains all external dependencies needed for business logic,
 * making executors pure functions of (options, context) → result.
 */
export interface ExecutorContext {
  /** Productive API client */
  readonly api: ProductiveApi;

  /** Resource resolver for smart ID resolution */
  readonly resolver: ResourceResolver;

  /** Minimal configuration */
  readonly config: ExecutorConfig;
}
