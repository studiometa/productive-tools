/**
 * Types for JSON:API resource formatting
 */

import type { ProductiveApiMeta, RelationshipData } from '../types.js';

// Re-export for convenience
export type { RelationshipData };

/**
 * JSON:API pagination metadata (raw from API).
 * Alias for ProductiveApiMeta.
 */
export type { ProductiveApiMeta as JsonApiMeta };
type JsonApiMeta = ProductiveApiMeta;

/**
 * Generic JSON:API resource structure
 */
export interface JsonApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, RelationshipData>;
}

/**
 * JSON:API response with included resources
 */
export interface JsonApiResponse<T = JsonApiResource | JsonApiResource[]> {
  data: T;
  meta?: JsonApiMeta;
  included?: JsonApiResource[];
}

/**
 * Formatted pagination metadata (clean output)
 */
export interface FormattedPagination {
  page: number;
  total_pages: number;
  total_count: number;
}

/**
 * Options for formatting resources
 */
export interface FormatOptions {
  /**
   * Include relationship IDs in output (e.g., person_id, project_id)
   * @default true for CLI compatibility
   */
  includeRelationshipIds?: boolean;

  /**
   * Include timestamps (created_at, updated_at)
   * @default true for CLI compatibility
   */
  includeTimestamps?: boolean;

  /**
   * Strip HTML from text fields (notes, descriptions)
   * @default true
   */
  stripHtml?: boolean;

  /**
   * Included resources from JSON:API response for resolving relationships
   */
  included?: JsonApiResource[];
}

/**
 * Default formatting options
 */
export const DEFAULT_FORMAT_OPTIONS: Required<Omit<FormatOptions, 'included'>> = {
  includeRelationshipIds: true,
  includeTimestamps: true,
  stripHtml: true,
};

/**
 * Formatted list response wrapper
 */
export interface FormattedListResponse<T> {
  data: T[];
  meta?: FormattedPagination;
}

// ============================================================================
// Formatted resource types
// ============================================================================

export interface FormattedTimeEntry {
  [key: string]: unknown;
  id: string;
  date: string;
  time_minutes: number;
  time_hours: string;
  note: string | null;
  billable_time?: number;
  approved?: boolean;
  // Optional relationship IDs (when includeRelationshipIds: true)
  person_id?: string;
  service_id?: string;
  project_id?: string;
  // Optional timestamps (when includeTimestamps: true)
  created_at?: string;
  updated_at?: string;
}

export interface FormattedProject {
  [key: string]: unknown;
  id: string;
  name: string;
  number: string | null;
  archived: boolean;
  budget?: number;
  // Optional timestamps (when includeTimestamps: true)
  created_at?: string;
  updated_at?: string;
}

export interface FormattedTask {
  [key: string]: unknown;
  id: string;
  number?: number;
  title: string;
  closed: boolean;
  due_date: string | null;
  description?: string | null;
  initial_estimate?: number;
  worked_time?: number;
  remaining_time?: number;
  // Optional relationship IDs (when includeRelationshipIds: true)
  project_id?: string;
  assignee_id?: string;
  status_id?: string;
  // Resolved relationship names (when included resources provided)
  project_name?: string;
  assignee_name?: string;
  status_name?: string;
  // Nested project/company for MCP compatibility
  project?: {
    id: string;
    name: string;
    number?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  // Optional timestamps (when includeTimestamps: true)
  created_at?: string;
  updated_at?: string;
}

export interface FormattedPerson {
  [key: string]: unknown;
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  active: boolean;
  title?: string;
  // Optional timestamps (when includeTimestamps: true)
  created_at?: string;
  updated_at?: string;
}

export interface FormattedService {
  [key: string]: unknown;
  id: string;
  name: string;
  budgeted_time?: number;
  worked_time?: number;
  // Optional timestamps (when includeTimestamps: true)
  created_at?: string;
  updated_at?: string;
}

export interface FormattedBudget {
  [key: string]: unknown;
  id: string;
  name?: string;
  budget_type?: number;
  billable?: boolean;
  started_on?: string;
  ended_on?: string;
  currency?: string;
  total_time_budget?: number;
  remaining_time_budget?: number;
  total_monetary_budget?: number;
  remaining_monetary_budget?: number;
  // Optional timestamps (when includeTimestamps: true)
  created_at?: string;
  updated_at?: string;
}
