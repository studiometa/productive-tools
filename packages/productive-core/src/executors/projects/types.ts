/**
 * Option types for project executors.
 */

import type { PaginationOptions } from '../types.js';

/**
 * Options for listing projects
 */
export interface ListProjectsOptions extends PaginationOptions {
  /** Filter by company ID or human-friendly identifier (name) */
  companyId?: string;
  /** Filter by responsible person ID or human-friendly identifier (email, name) */
  responsibleId?: string;
  /** Filter by person ID or human-friendly identifier (email, name) */
  personId?: string;
  /** Project type: 'internal' | 'client' */
  projectType?: string;
  /** Status: 'active' | 'archived' */
  status?: string;
  /** Additional raw filters to pass through */
  additionalFilters?: Record<string, string>;
}

/**
 * Options for getting a single project
 */
export interface GetProjectOptions {
  /** Project ID or human-friendly identifier (e.g., PRJ-123) */
  id: string;
}
