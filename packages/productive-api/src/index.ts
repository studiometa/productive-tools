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
  ProductiveBooking,
  ProductiveBudget,
  ProductiveComment,
  ProductiveCompany,
  ProductiveConfig,
  ProductiveDeal,
  ProductivePerson,
  ProductiveProject,
  ProductiveReport,
  ProductiveService,
  ProductiveTask,
  ProductiveTimeEntry,
  ProductiveTimer,
  RelationshipData,
} from './types.js';

/** Backward-compatible alias for ProductiveApiMeta */
export type { ProductiveApiMeta as JsonApiMeta } from './types.js';

// Formatters
export {
  formatTimeEntry,
  formatProject,
  formatTask,
  formatPerson,
  formatService,
  formatCompany,
  formatComment,
  formatTimer,
  formatDeal,
  formatBooking,
  formatBudget,
  formatListResponse,
} from './formatters/index.js';

export type {
  JsonApiResource,
  JsonApiMeta as JsonApiResponseMeta,
  FormatOptions,
  FormattedPagination,
} from './formatters/types.js';

// Re-export formatter types used by MCP
export type { JsonApiResponse } from './formatters/types.js';

// Utils
export { stripHtml, truncate } from './utils/html.js';
