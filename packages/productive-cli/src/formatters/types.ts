/**
 * Re-export all formatter types from @studiometa/productive-api.
 *
 * CLI previously maintained its own copy of these types.
 * Now the single source of truth lives in productive-api.
 */
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
