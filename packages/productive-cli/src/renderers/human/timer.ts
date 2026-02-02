/**
 * Human-readable renderers for Timer resources
 */

import type { FormattedTimer } from '../../formatters/timer.js';
import type { FormattedListResponse } from '../../formatters/types.js';
import type { RenderContext, ListRenderer, Renderer } from '../types.js';

import { colors } from '../../utils/colors.js';

/**
 * Format duration in minutes to human-readable string
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Render a list of timers in human-readable format
 */
export class HumanTimerListRenderer implements ListRenderer<FormattedTimer> {
  render(data: FormattedListResponse<FormattedTimer>, ctx: RenderContext): void {
    const { data: timers, meta } = data;

    if (timers.length === 0) {
      console.log(ctx.noColor ? 'No timers found' : colors.dim('No timers found'));
      return;
    }

    // Header
    if (meta) {
      const pageInfo = `Page ${meta.page}/${meta.total_pages} (${meta.total_count} total)`;
      console.log(ctx.noColor ? pageInfo : colors.dim(pageInfo));
      console.log();
    }

    // List timers
    for (const timer of timers) {
      // Status indicator
      const status = timer.running ? '[RUNNING]' : '[STOPPED]';
      const statusColored = timer.running
        ? ctx.noColor
          ? status
          : colors.green(status)
        : ctx.noColor
          ? status
          : colors.dim(status);

      // Time info
      const startTime = timer.started_at.split('T')[1]?.split('.')[0] || timer.started_at;
      const startDate = timer.started_at.split('T')[0];

      console.log(
        `${statusColored} ${ctx.noColor ? startDate : colors.bold(startDate)} at ${startTime}`,
      );

      // Duration
      const duration = formatDuration(timer.total_time);
      console.log(ctx.noColor ? `  Duration: ${duration}` : colors.dim(`  Duration: ${duration}`));

      // IDs
      const idLine = `ID: ${timer.id}`;
      console.log(ctx.noColor ? `  ${idLine}` : colors.dim(`  ${idLine}`));

      if (timer.time_entry_id) {
        const entryLine = `Time Entry: ${timer.time_entry_id}`;
        console.log(ctx.noColor ? `  ${entryLine}` : colors.dim(`  ${entryLine}`));
      }

      console.log();
    }
  }
}

/**
 * Render a single timer detail in human-readable format
 */
export class HumanTimerDetailRenderer implements Renderer<FormattedTimer> {
  render(timer: FormattedTimer, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();

    // Status
    const status = timer.running ? '[RUNNING]' : '[STOPPED]';
    const statusColored = timer.running
      ? ctx.noColor
        ? status
        : colors.green(status)
      : ctx.noColor
        ? status
        : colors.dim(status);
    console.log(statusColored);
    console.log();

    console.log(label('ID:'), timer.id);
    console.log(label('Person ID:'), timer.person_id);
    console.log(label('Started at:'), timer.started_at);

    if (timer.stopped_at) {
      console.log(label('Stopped at:'), timer.stopped_at);
    }

    console.log(label('Total time:'), formatDuration(timer.total_time));

    if (timer.time_entry_id) {
      console.log(label('Time Entry ID:'), timer.time_entry_id);
    }

    console.log();
  }
}

// Singleton instances
export const humanTimerListRenderer = new HumanTimerListRenderer();
export const humanTimerDetailRenderer = new HumanTimerDetailRenderer();
