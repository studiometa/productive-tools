export { Productive } from './productive.js';
export type { ProductiveOptions } from './productive.js';
export { loadConfig, ConfigurationError } from './config.js';
export type { LoadConfigResult, ConfigSource } from './config.js';
export { AsyncPaginatedIterator } from './pagination.js';
export type { PageFetcher } from './pagination.js';
export { QueryBuilder } from './query-builder.js';
export type { BaseListOptions } from './query-builder.js';
export { resolveResource, resolveListResponse, resolveSingleResponse } from './json-api.js';
export type { ResolvedResource } from './json-api.js';
export type {
  ResourceRef,
  Task,
  Project,
  TimeEntry,
  Person,
  Company,
  Deal,
  Service,
  Comment,
  Timer,
  Discussion,
  Booking,
  Page,
  Attachment,
  Activity,
} from './types.js';
export {
  ProductiveError,
  ResourceNotFoundError,
  RateLimitError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  wrapError,
  isProductiveError,
} from './errors.js';

// Re-export status/type constants from productive-api
export { createStatusMap } from '@studiometa/productive-api';
export type { StatusMap } from '@studiometa/productive-api';
export {
  TASK_STATUS,
  TASK_OVERDUE_STATUS,
  PROJECT_STATUS,
  PROJECT_TYPE,
  DEAL_STATUS,
  DEAL_TYPE,
  DEAL_BUDGET_STATUS,
  TIME_STATUS,
  TIME_BILLING_TYPE,
  TIME_INVOICING_STATUS,
  PERSON_STATUS,
  PERSON_TYPE,
  COMPANY_STATUS,
  DISCUSSION_STATUS,
  SERVICE_BUDGET_STATUS,
  SERVICE_BILLING_TYPE,
} from '@studiometa/productive-api';
