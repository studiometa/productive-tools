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
export {
  fromCommandContext,
  type CommandContextLike,
  type FromCommandContextOptions,
} from './context/index.js';
export {
  fromHandlerContext,
  type HandlerContextLike,
  type FromHandlerContextOptions,
} from './context/index.js';

// Resource resolver
export {
  createResourceResolver,
  resolve as resolveResource,
  isNumericId,
  needsResolution,
  detectResourceType,
  resolveFilterValue,
  resolveFilterIds,
  ResolveError,
  FILTER_TYPE_MAPPING,
} from './resolvers/index.js';
export type {
  DetectionResult,
  ResolveResult,
  ResolveOptions,
  ResolverCache,
  ResolvedMetadata,
  CreateResolverOptions,
} from './resolvers/index.js';

// Executor types and errors
export type { Executor, ExecutorResult, PaginationOptions } from './executors/types.js';
export { ExecutorValidationError } from './executors/errors.js';

// Time executors
export {
  buildTimeEntryFilters,
  createTimeEntry,
  deleteTimeEntry,
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

// Tasks executors
export {
  buildTaskFilters,
  createTask,
  getTask,
  listTasks,
  updateTask,
} from './executors/tasks/index.js';
export type {
  CreateTaskOptions,
  GetTaskOptions,
  ListTasksOptions,
  UpdateTaskOptions,
} from './executors/tasks/index.js';

// Deals executors
export {
  buildDealFilters,
  createDeal,
  getDeal,
  listDeals,
  updateDeal,
} from './executors/deals/index.js';
export type {
  CreateDealOptions,
  GetDealOptions,
  ListDealsOptions,
  UpdateDealOptions,
} from './executors/deals/index.js';

// Bookings executors
export {
  buildBookingFilters,
  createBooking,
  getBooking,
  listBookings,
  updateBooking,
} from './executors/bookings/index.js';
export type {
  CreateBookingOptions,
  GetBookingOptions,
  ListBookingsOptions,
  UpdateBookingOptions,
} from './executors/bookings/index.js';

// Comments executors
export {
  buildCommentFilters,
  createComment,
  getComment,
  listComments,
  updateComment,
} from './executors/comments/index.js';
export type {
  CreateCommentOptions,
  GetCommentOptions,
  ListCommentsOptions,
  UpdateCommentOptions,
} from './executors/comments/index.js';

// Timers executors
export {
  buildTimerFilters,
  getTimer,
  listTimers,
  startTimer,
  stopTimer,
} from './executors/timers/index.js';
export type {
  GetTimerOptions,
  ListTimersOptions,
  StartTimerOptions,
  StopTimerOptions,
} from './executors/timers/index.js';

// Budgets executors
export { buildBudgetFilters, getBudget, listBudgets } from './executors/budgets/index.js';
export type { GetBudgetOptions, ListBudgetsOptions } from './executors/budgets/index.js';

// Reports executors
export {
  buildReportFilters,
  DEFAULT_GROUPS,
  DEFAULT_INCLUDES,
  getReport,
  resolveGroup,
  resolveIncludes,
  VALID_REPORT_TYPES,
} from './executors/reports/index.js';
export type { GetReportOptions, ReportType } from './executors/reports/index.js';
