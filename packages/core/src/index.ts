/**
 * @studiometa/productive-core
 *
 * Shared business logic for Productive.io tools.
 * Provides executor functions with injectable dependencies for testability.
 */

// Constants — single source of truth for resources, actions, report types
export { RESOURCES, ACTIONS, REPORT_TYPES, VALID_REPORT_TYPES } from './constants.js';
export type { Resource, Action, ReportType } from './constants.js';

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
export {
  buildProjectFilters,
  getProject,
  getProjectContext,
  listProjects,
} from './executors/projects/index.js';
export type {
  GetProjectContextOptions,
  GetProjectOptions,
  ListProjectsOptions,
  ProjectContextResult,
} from './executors/projects/index.js';

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
  getTaskContext,
  listTasks,
  updateTask,
} from './executors/tasks/index.js';
export type {
  CreateTaskOptions,
  GetTaskContextOptions,
  GetTaskOptions,
  ListTasksOptions,
  TaskContextResult,
  UpdateTaskOptions,
} from './executors/tasks/index.js';

// Deals executors
export {
  buildDealFilters,
  createDeal,
  getDeal,
  getDealContext,
  listDeals,
  updateDeal,
} from './executors/deals/index.js';
export type {
  CreateDealOptions,
  DealContextResult,
  GetDealContextOptions,
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

// Attachments executors
export {
  buildAttachmentFilters,
  deleteAttachment,
  getAttachment,
  listAttachments,
} from './executors/attachments/index.js';
export type {
  DeleteAttachmentOptions,
  DeleteAttachmentResult,
  GetAttachmentOptions,
  ListAttachmentsOptions,
} from './executors/attachments/index.js';

// Pages executors
export {
  buildPageFilters,
  createPage,
  deletePage,
  getPage,
  listPages,
  updatePage,
} from './executors/pages/index.js';
export type {
  CreatePageOptions,
  DeletePageOptions,
  GetPageOptions,
  ListPagesOptions,
  UpdatePageOptions,
} from './executors/pages/index.js';

// Discussions executors
export {
  buildDiscussionFilters,
  createDiscussion,
  deleteDiscussion,
  getDiscussion,
  listDiscussions,
  reopenDiscussion,
  resolveDiscussion,
  updateDiscussion,
} from './executors/discussions/index.js';
export type {
  CreateDiscussionOptions,
  DeleteDiscussionOptions,
  GetDiscussionOptions,
  ListDiscussionsOptions,
  ReopenDiscussionOptions,
  ResolveDiscussionOptions,
  UpdateDiscussionOptions,
} from './executors/discussions/index.js';

// Reports executors
export {
  buildReportFilters,
  DEFAULT_GROUPS,
  DEFAULT_INCLUDES,
  getReport,
  resolveGroup,
  resolveIncludes,
} from './executors/reports/index.js';
export type { GetReportOptions } from './executors/reports/index.js';
