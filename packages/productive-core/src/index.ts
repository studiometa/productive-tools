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
export { fromCommandContext, type CommandContextLike } from './context/index.js';
export {
  fromHandlerContext,
  type HandlerContextLike,
  type McpResolveFunctions,
} from './context/index.js';

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

// Project executors
export { buildProjectFilters, getProject, listProjects } from './executors/projects/index.js';
export type { GetProjectOptions, ListProjectsOptions } from './executors/projects/index.js';

// People executors
export { buildPeopleFilters, getPerson, listPeople } from './executors/people/index.js';
export type { GetPersonOptions, ListPeopleOptions } from './executors/people/index.js';

// Services executors
export { buildServicesFilters, listServices } from './executors/services/index.js';
export type { ListServicesOptions } from './executors/services/index.js';

// Companies executors
export {
  buildCompanyFilters,
  createCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from './executors/companies/index.js';
export type {
  CreateCompanyOptions,
  GetCompanyOptions,
  ListCompaniesOptions,
  UpdateCompanyOptions,
} from './executors/companies/index.js';
