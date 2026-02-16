import type { PaginationOptions } from '../types.js';

export interface ListTimersOptions extends PaginationOptions {
  personId?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetTimerOptions {
  id: string;
}

export interface StartTimerOptions {
  serviceId?: string;
  timeEntryId?: string;
  personId?: string;
}

export interface StopTimerOptions {
  id: string;
}
