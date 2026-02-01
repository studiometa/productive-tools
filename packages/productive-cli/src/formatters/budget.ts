/**
 * Budget formatting
 */

import type {
  JsonApiResource,
  FormattedBudget,
} from './types.js';

/**
 * Format a budget resource for output
 * Note: Budgets don't have timestamps in the API
 */
export function formatBudget(budget: JsonApiResource): FormattedBudget {
  const attrs = budget.attributes;

  const result: FormattedBudget = {
    id: budget.id,
  };

  // Include budget fields if present
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

  return result;
}
