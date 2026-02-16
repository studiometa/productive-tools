/**
 * Re-export all formatters from @studiometa/productive-api.
 *
 * CLI previously maintained its own copy of these formatters (~1200 LOC).
 * Now the single source of truth lives in productive-api.
 */

// Types
export type {
  JsonApiResource,
  JsonApiResponse,
  JsonApiMeta,
  FormattedPagination,
  FormatOptions,
  FormattedListResponse,
  FormattedTimeEntry,
  FormattedProject,
  FormattedTask,
  FormattedPerson,
  FormattedService,
  FormattedBudget,
  FormattedCompany,
  FormattedComment,
  FormattedTimer,
  FormattedDeal,
  FormattedBooking,
} from '@studiometa/productive-api';

export { DEFAULT_FORMAT_OPTIONS } from '@studiometa/productive-api';

// Individual resource formatters
export {
  formatTimeEntry,
  formatProject,
  formatTask,
  formatPerson,
  formatService,
  formatBudget,
  formatCompany,
  formatComment,
  formatTimer,
  formatDeal,
  formatBooking,
} from '@studiometa/productive-api';

// List/single/auto formatting
export {
  formatListResponse,
  formatSingleResponse,
  formatResponse,
} from '@studiometa/productive-api';

// Pagination
export { formatPagination, hasMorePages } from '@studiometa/productive-api';

// HTML utilities
export { stripHtml } from '@studiometa/productive-api';
