/**
 * Human-readable renderer for budgets
 *
 * Displays budgets with time and monetary budget information.
 */

import type { FormattedBudget, FormattedPagination } from '@studiometa/productive-api';

import type { ListRenderer, Renderer, RenderContext } from '../types.js';

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
function formatCurrency(value: number | undefined, currency?: string): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'EUR',
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
    const nameStr = budget.name ? ` ${budget.name}` : '';
    console.log(`${colors.bold('Budget')} ${linkedId(budget.id, 'budget')}${nameStr}`);

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
      const total = formatCurrency(
        budget.total_monetary_budget,
        budget.currency as string | undefined,
      );
      const remaining = formatCurrency(
        budget.remaining_monetary_budget,
        budget.currency as string | undefined,
      );
      const used = budget.total_monetary_budget - (budget.remaining_monetary_budget || 0);
      const usedStr = formatCurrency(used, budget.currency as string | undefined);

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
 * Render a single budget detail in human-readable format
 */
export class HumanBudgetDetailRenderer implements Renderer<FormattedBudget> {
  render(budget: FormattedBudget, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();

    const nameStr = budget.name || 'Untitled Budget';
    console.log(ctx.noColor ? nameStr : colors.bold(nameStr));
    console.log();

    console.log(label('ID:'), budget.id);

    if (budget.billable !== undefined) {
      console.log(label('Billable:'), budget.billable ? 'Yes' : 'No');
    }

    if (budget.started_on) {
      console.log(label('Start date:'), budget.started_on);
    }

    if (budget.ended_on) {
      console.log(label('End date:'), budget.ended_on);
    }

    if (budget.currency) {
      console.log(label('Currency:'), budget.currency);
    }

    // Time budget
    if (budget.total_time_budget !== undefined) {
      const total = formatTime(budget.total_time_budget);
      const remaining = formatTime(budget.remaining_time_budget);
      const used = budget.total_time_budget - (budget.remaining_time_budget || 0);
      const usedStr = formatTime(used);

      const isOverBudget =
        budget.remaining_time_budget !== undefined && budget.remaining_time_budget < 0;

      console.log(
        `${label('Time:')} ${usedStr} / ${total} ${ctx.noColor ? 'remaining:' : colors.dim('remaining:')} ${isOverBudget ? (ctx.noColor ? remaining : colors.red(remaining)) : remaining}`,
      );
    }

    // Monetary budget
    if (budget.total_monetary_budget !== undefined) {
      const currency = budget.currency as string | undefined;
      const total = formatCurrency(budget.total_monetary_budget, currency);
      const remaining = formatCurrency(budget.remaining_monetary_budget, currency);
      const used = budget.total_monetary_budget - (budget.remaining_monetary_budget || 0);
      const usedStr = formatCurrency(used, currency);

      const isOverBudget =
        budget.remaining_monetary_budget !== undefined && budget.remaining_monetary_budget < 0;

      console.log(
        `${label('Cost:')} ${usedStr} / ${total} ${ctx.noColor ? 'remaining:' : colors.dim('remaining:')} ${isOverBudget ? (ctx.noColor ? remaining : colors.red(remaining)) : remaining}`,
      );
    }

    if (budget.created_at) {
      console.log(label('Created:'), budget.created_at.split('T')[0]);
    }

    console.log();
  }
}

/**
 * Singleton instances for convenience
 */
export const humanBudgetListRenderer = new HumanBudgetListRenderer();
export const humanBudgetDetailRenderer = new HumanBudgetDetailRenderer();
