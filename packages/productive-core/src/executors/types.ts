/**
 * Shared executor types.
 *
 * Executors are pure business logic functions:
 *   (options, context) → ExecutorResult<T>
 *
 * They never do I/O side effects (no console.log, no spinners, no process.exit).
 * Adapters (CLI, MCP) handle all I/O concerns.
 */

import type { IncludedResource, JsonApiMeta } from '@studiometa/productive-api';

import type { ExecutorContext, ResolvedInfo } from '../context/types.js';

/**
 * Result returned by all executor functions.
 *
 * @template T - The shape of the data payload
 */
export interface ExecutorResult<T> {
  /** The main data payload */
  data: T;

  /** Pagination metadata (for list operations) */
  meta?: JsonApiMeta;

  /** JSON:API included resources (for list/get with includes) */
  included?: IncludedResource[];

  /** Information about any smart ID resolutions that occurred */
  resolved?: Record<string, ResolvedInfo>;
}

/**
 * Pagination options common to all list executors
 */
export interface PaginationOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  /** JSON:API include parameter for sideloading related resources */
  include?: string[];
}

/**
 * Generic executor function signature
 */
export type Executor<TOptions, TData> = (
  options: TOptions,
  context: ExecutorContext,
) => Promise<ExecutorResult<TData>>;
