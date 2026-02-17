/**
 * Human-readable renderer for time entries
 *
 * Displays time entries with formatted dates, durations, and notes.
 */

import type { FormattedTimeEntry, FormattedPagination } from '@studiometa/productive-api';

import type { ListRenderer, Renderer, RenderContext } from '../types.js';

import { colors } from '../../utils/colors.js';
import { link } from '../../utils/html.js';
import { timeEntriesUrl } from '../../utils/productive-links.js';

/**
 * Format minutes as "Xh YYm"
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
}

/**
 * Renderer for a list of time entries with totals and pagination
 */
export class HumanTimeEntryListRenderer implements ListRenderer<FormattedTimeEntry> {
  render(
    data: { data: FormattedTimeEntry[]; meta?: FormattedPagination },
    ctx: RenderContext,
  ): void {
    let totalMinutes = 0;

    for (const entry of data.data) {
      this.renderItem(entry, ctx);
      totalMinutes += entry.time_minutes;
    }

    if (data.data.length > 0) {
      this.renderTotal(totalMinutes);
    }

    if (data.meta) {
      this.renderPagination(data.meta, ctx);
    }
  }

  renderItem(entry: FormattedTimeEntry, _ctx: RenderContext): void {
    const duration = colors.green(formatDuration(entry.time_minutes));

    const dateUrl = timeEntriesUrl(entry.date);
    const dateDisplay = dateUrl ? link(colors.bold(entry.date), dateUrl) : colors.bold(entry.date);

    console.log(`${dateDisplay}  ${duration}  ${colors.dim(`#${entry.id}`)}`);

    if (entry.note) {
      console.log(`  ${colors.dim(entry.note)}`);
    }
    console.log();
  }

  renderPagination(meta: FormattedPagination, _ctx: RenderContext): void {
    console.log(
      colors.dim(`Page ${meta.page}/${meta.total_pages} (Total: ${meta.total_count} entries)`),
    );
  }

  private renderTotal(totalMinutes: number): void {
    console.log(colors.bold(colors.cyan(`Total: ${formatDuration(totalMinutes)}`)));
  }
}

/**
 * Renderer for a single time entry detail view
 */
export class HumanTimeEntryDetailRenderer implements Renderer<FormattedTimeEntry> {
  render(entry: FormattedTimeEntry, _ctx: RenderContext): void {
    console.log(colors.bold('Time Entry'));
    console.log(colors.dim('─'.repeat(50)));
    console.log(`${colors.cyan('ID:')}       ${entry.id}`);
    console.log(`${colors.cyan('Date:')}     ${entry.date}`);
    console.log(
      `${colors.cyan('Duration:')} ${colors.green(formatDuration(entry.time_minutes))} ${colors.dim(`(${entry.time_minutes} minutes)`)}`,
    );
    if (entry.note) {
      console.log(`${colors.cyan('Note:')}     ${entry.note}`);
    }
  }
}

/**
 * Singleton instances for convenience
 */
export const humanTimeEntryListRenderer = new HumanTimeEntryListRenderer();
export const humanTimeEntryDetailRenderer = new HumanTimeEntryDetailRenderer();
