export { ProductiveApi, ProductiveApiError } from './api.js';
export { getConfig, setConfig, clearConfig, showConfig, validateConfig } from './config.js';
export { OutputFormatter, createSpinner } from './output.js';
export { ErrorMessages } from './error-messages.js';
export {
  CliError,
  ConfigError,
  ValidationError,
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  CacheError,
  CommandError,
  isCliError,
  isApiError,
  isRecoverable,
  fromLegacyError,
} from './errors.js';
export type {
  ProductiveConfig,
  ProductiveApiResponse,
  ProductiveProject,
  ProductiveTimeEntry,
  ProductiveTask,
  ProductivePerson,
  ProductiveService,
  ProductiveBudget,
  ProductiveCompany,
  ProductiveComment,
  ProductiveTimer,
  ProductiveDeal,
  ProductiveBooking,
  ProductiveReport,
  RelationshipData,
  IncludedResource,
  OutputFormat,
  CliOptions,
} from './types.js';

// Formatters
export {
  // Individual formatters
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
  // List formatting
  formatListResponse,
  formatSingleResponse,
  formatResponse,
  // Pagination
  formatPagination,
  hasMorePages,
  // HTML utilities
  stripHtml,
  // Constants
  DEFAULT_FORMAT_OPTIONS,
} from './formatters/index.js';

export type {
  // Types
  JsonApiResource,
  JsonApiResponse,
  JsonApiMeta,
  FormatOptions,
  FormattedPagination,
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
} from './formatters/index.js';
