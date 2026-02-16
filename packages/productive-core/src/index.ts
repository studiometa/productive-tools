/**
 * @studiometa/productive-core
 *
 * Shared business logic for Productive.io tools.
 * Provides executor functions with injectable dependencies for testability.
 */

// Context
export type {
  ExecutorConfig,
  ExecutorContext,
  ResolvableResourceType,
  ResolvedInfo,
  ResourceResolver,
} from './context/index.js';
export { createTestExecutorContext, defaultTestConfig, noopResolver } from './context/index.js';

// Executor types
export type { Executor, ExecutorResult, PaginationOptions } from './executors/types.js';

// Time executors
export {
  buildTimeEntryFilters,
  createTimeEntry,
  deleteTimeEntry,
  ExecutorValidationError,
  getTimeEntry,
  listTimeEntries,
  updateTimeEntry,
} from './executors/time/index.js';
export type {
  CreateTimeEntryOptions,
  DeleteTimeEntryOptions,
  DeleteResult,
  GetTimeEntryOptions,
  ListTimeEntriesOptions,
  UpdateTimeEntryOptions,
} from './executors/time/index.js';
