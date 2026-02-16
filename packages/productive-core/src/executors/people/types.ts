/**
 * Option types for people executors.
 */

import type { PaginationOptions } from '../types.js';

export interface ListPeopleOptions extends PaginationOptions {
  companyId?: string;
  projectId?: string;
  role?: string;
  team?: string;
  /** Person type: 'user' | 'contact' | 'placeholder' */
  personType?: string;
  /** Status: 'active' | 'deactivated' | 'inactive' */
  status?: string;
  additionalFilters?: Record<string, string>;
}

export interface GetPersonOptions {
  /** Person ID or human-friendly identifier (email) */
  id: string;
}
