/**
 * @studiometa/productive-api
 *
 * Productive.io API client, types, and formatters.
 * Zero internal dependencies — this is the foundation package.
 */

// API client
export { ProductiveApi } from './client.js';
export type { ApiOptions } from './client.js';

// Rate limiter
export { RateLimiter, DEFAULT_RATE_LIMIT_CONFIG } from './rate-limiter.js';
export type { RateLimitConfig } from './rate-limiter.js';

// Error
export { ProductiveApiError } from './error.js';

// Cache interface
export type { ApiCache } from './cache.js';
export { noopCache } from './cache.js';

// Types
export type {
  IncludedResource,
  ProductiveApiMeta,
  ProductiveApiResponse,
  ProductiveAttachment,
  ProductiveBooking,
  ProductiveComment,
  ProductiveCompany,
  ProductiveConfig,
  ProductiveCustomField,
  ProductiveCustomFieldOption,
  CustomFieldDataType,
  ProductiveDeal,
  ProductiveDiscussion,
  ProductivePage,
  ProductivePerson,
  ProductiveProject,
  ProductiveReport,
  ProductiveService,
  ProductiveTask,
  ProductiveTimeEntry,
  ProductiveTimer,
  ProductiveActivity,
  ActivityChangesetEntry,
  RelationshipData,
} from './types.js';

// Formatters
export {
  // Individual resource formatters
  formatTimeEntry,
  formatProject,
  formatTask,
  formatPerson,
  formatService,
  formatCompany,
  formatComment,
  formatTimer,
  formatDeal,
  formatAttachment,
  formatBooking,
  formatPage,
  formatDiscussion,
  formatActivity,
  formatChangeset,
  formatCustomField,
  formatCustomFieldOption,
  // List/single/auto formatting
  formatListResponse,
  formatSingleResponse,
  formatResponse,
  // Pagination
  formatPagination,
  hasMorePages,
  // Constants
  DEFAULT_FORMAT_OPTIONS,
} from './formatters/index.js';

export type {
  // Core types
  FormatOptions,
  FormattedPagination,
  FormattedListResponse,
  JsonApiMeta,
  JsonApiResource,
  JsonApiResponse,
  // Formatted resource types
  FormattedTimeEntry,
  FormattedProject,
  FormattedTask,
  FormattedPerson,
  FormattedService,
} from './formatters/types.js';

export type { FormattedCompany } from './formatters/company.js';
export type { FormattedComment } from './formatters/comment.js';
export type { FormattedTimer } from './formatters/timer.js';
export type { FormattedDeal } from './formatters/deal.js';
export type { FormattedBooking } from './formatters/booking.js';
export type { FormattedAttachment } from './formatters/attachment.js';
export type { FormattedPage } from './formatters/page.js';
export type { FormattedDiscussion } from './formatters/discussion.js';
export type { FormattedActivity } from './formatters/activity.js';
export type {
  FormattedCustomField,
  FormattedCustomFieldOption,
} from './formatters/custom-field.js';

// Status/type constants (bidirectional lookup maps)
export { createStatusMap, createNumericStatusMap } from './constants.js';
export type { StatusMap, NumericStatusMap } from './constants.js';
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
  CUSTOM_FIELD_DATA_TYPE,
} from './constants.js';

// Config (env vars + JSON file, no keychain)
export { getConfig, setConfig, deleteConfig, clearConfig } from './config.js';

// Utils
export { stripHtml, truncate } from './utils/html.js';
export { ConfigStore } from './utils/config-store.js';
