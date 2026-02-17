/**
 * Budget formatting
 */

import type { JsonApiResource, FormatOptions, FormattedBudget } from './types.js';

import { DEFAULT_FORMAT_OPTIONS } from './types.js';

/**
 * Format a budget resource for output
 */
export function formatBudget(budget: JsonApiResource, options?: FormatOptions): FormattedBudget {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  const attrs = budget.attributes;

  const result: FormattedBudget = {
    id: budget.id,
  };

  // Core fields
  if (attrs.name !== undefined) {
    result.name = String(attrs.name);
  }
  if (attrs.budget_type !== undefined) {
    result.budget_type = attrs.budget_type as number;
  }
  if (attrs.billable !== undefined) {
    result.billable = attrs.billable as boolean;
  }
  if (attrs.started_on !== undefined) {
    result.started_on = attrs.started_on ? String(attrs.started_on) : undefined;
  }
  if (attrs.ended_on !== undefined) {
    result.ended_on = attrs.ended_on ? String(attrs.ended_on) : undefined;
  }
  if (attrs.currency !== undefined) {
    result.currency = attrs.currency ? String(attrs.currency) : undefined;
  }

  // Budget values
  if (attrs.total_time_budget !== undefined) {
    result.total_time_budget = attrs.total_time_budget as number;
  }
  if (attrs.remaining_time_budget !== undefined) {
    result.remaining_time_budget = attrs.remaining_time_budget as number;
  }
  if (attrs.total_monetary_budget !== undefined) {
    result.total_monetary_budget = attrs.total_monetary_budget as number;
  }
  if (attrs.remaining_monetary_budget !== undefined) {
    result.remaining_monetary_budget = attrs.remaining_monetary_budget as number;
  }

  // Timestamps
  if (opts.includeTimestamps) {
    result.created_at = attrs.created_at ? String(attrs.created_at) : undefined;
    result.updated_at = attrs.updated_at ? String(attrs.updated_at) : undefined;
  }

  return result;
}
