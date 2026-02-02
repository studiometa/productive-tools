/**
 * Human-readable renderer for budgets
 *
 * Displays budgets with time and monetary budget information.
 */

import type { FormattedBudget, FormattedPagination } from '../../formatters/types.js';
import type { ListRenderer, RenderContext } from '../types.js';

import { colors } from '../../utils/colors.js';
import { linkedId } from '../../utils/productive-links.js';

/**
 * Format time in minutes to human readable format
 */
function formatTime(minutes: number | undefined): string {
  if (minutes === undefined || minutes === null) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}m`;
}

/**
 * Format currency value
 */
function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

/**
 * Renderer for a list of budgets with pagination
 */
export class HumanBudgetListRenderer implements ListRenderer<FormattedBudget> {
  render(data: { data: FormattedBudget[]; meta?: FormattedPagination }, ctx: RenderContext): void {
    for (const budget of data.data) {
      this.renderItem(budget, ctx);
    }

    if (data.meta) {
      this.renderPagination(data.meta, ctx);
    }
  }

  renderItem(budget: FormattedBudget, _ctx: RenderContext): void {
    console.log(`${colors.bold('Budget')} ${linkedId(budget.id, 'budget')}`);

    // Time budget
    if (budget.total_time_budget !== undefined) {
      const total = formatTime(budget.total_time_budget);
      const remaining = formatTime(budget.remaining_time_budget);
      const used = budget.total_time_budget - (budget.remaining_time_budget || 0);
      const usedStr = formatTime(used);

      const isOverBudget =
        budget.remaining_time_budget !== undefined && budget.remaining_time_budget < 0;

      console.log(
        `  ${colors.cyan('Time:')} ${usedStr} / ${total} ${colors.dim('remaining:')} ${isOverBudget ? colors.red(remaining) : remaining}`,
      );
    }

    // Monetary budget
    if (budget.total_monetary_budget !== undefined) {
      const total = formatCurrency(budget.total_monetary_budget);
      const remaining = formatCurrency(budget.remaining_monetary_budget);
      const used = budget.total_monetary_budget - (budget.remaining_monetary_budget || 0);
      const usedStr = formatCurrency(used);

      const isOverBudget =
        budget.remaining_monetary_budget !== undefined && budget.remaining_monetary_budget < 0;

      console.log(
        `  ${colors.cyan('Cost:')} ${usedStr} / ${total} ${colors.dim('remaining:')} ${isOverBudget ? colors.red(remaining) : remaining}`,
      );
    }

    console.log();
  }

  renderPagination(meta: FormattedPagination, _ctx: RenderContext): void {
    console.log(colors.dim(`Page ${meta.page}/${meta.total_pages} (Total: ${meta.total_count})`));
  }
}

/**
 * Singleton instance for convenience
 */
export const humanBudgetListRenderer = new HumanBudgetListRenderer();
