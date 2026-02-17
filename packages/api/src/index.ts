/**
 * @studiometa/productive-api
 *
 * Productive.io API client, types, and formatters.
 * Zero internal dependencies — this is the foundation package.
 */

// API client
export { ProductiveApi } from './client.js';
export type { ApiOptions } from './client.js';

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
  ProductiveBudget,
  ProductiveComment,
  ProductiveCompany,
  ProductiveConfig,
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
  formatBudget,
  formatPage,
  formatDiscussion,
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
  FormattedBudget,
} from './formatters/types.js';

export type { FormattedCompany } from './formatters/company.js';
export type { FormattedComment } from './formatters/comment.js';
export type { FormattedTimer } from './formatters/timer.js';
export type { FormattedDeal } from './formatters/deal.js';
export type { FormattedBooking } from './formatters/booking.js';
export type { FormattedAttachment } from './formatters/attachment.js';
export type { FormattedPage } from './formatters/page.js';
export type { FormattedDiscussion } from './formatters/discussion.js';

// Config (env vars + JSON file, no keychain)
export { getConfig, setConfig, deleteConfig, clearConfig } from './config.js';

// Utils
export { stripHtml, truncate } from './utils/html.js';
export { ConfigStore } from './utils/config-store.js';
