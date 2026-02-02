/**
 * Human-readable renderers for Booking resources
 */

import type { FormattedBooking } from '../../formatters/booking.js';
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
 * Render a list of bookings in human-readable format
 */
export class HumanBookingListRenderer implements ListRenderer<FormattedBooking> {
  render(data: FormattedListResponse<FormattedBooking>, ctx: RenderContext): void {
    const { data: bookings, meta } = data;

    if (bookings.length === 0) {
      console.log(ctx.noColor ? 'No bookings found' : colors.dim('No bookings found'));
      return;
    }

    // Header
    if (meta) {
      const pageInfo = `Page ${meta.page}/${meta.total_pages} (${meta.total_count} total)`;
      console.log(ctx.noColor ? pageInfo : colors.dim(pageInfo));
      console.log();
    }

    // List bookings
    for (const booking of bookings) {
      // Status indicator
      let status = booking.draft ? '[TENTATIVE]' : '[CONFIRMED]';
      let statusColored = booking.draft
        ? ctx.noColor
          ? status
          : colors.yellow(status)
        : ctx.noColor
          ? status
          : colors.green(status);

      if (booking.rejected_at) {
        status = '[REJECTED]';
        statusColored = ctx.noColor ? status : colors.red(status);
      } else if (booking.approved_at) {
        status = '[APPROVED]';
        statusColored = ctx.noColor ? status : colors.green(status);
      }

      // Date range
      const dateRange = `${booking.started_on} → ${booking.ended_on}`;
      console.log(`${statusColored} ${ctx.noColor ? dateRange : colors.bold(dateRange)}`);

      // Person and service
      const details: string[] = [];
      if (booking.person_name) details.push(`Person: ${booking.person_name}`);
      if (booking.service_name) details.push(`Service: ${booking.service_name}`);
      if (booking.event_id) details.push(`Event: ${booking.event_id}`);

      if (details.length > 0) {
        const detailLine = details.join(' | ');
        console.log(ctx.noColor ? `  ${detailLine}` : colors.dim(`  ${detailLine}`));
      }

      // Time info
      const timeInfo: string[] = [];
      if (booking.time) timeInfo.push(`${formatDuration(booking.time)}/day`);
      if (booking.total_time) timeInfo.push(`Total: ${formatDuration(booking.total_time)}`);
      if (booking.percentage) timeInfo.push(`${booking.percentage}%`);

      if (timeInfo.length > 0) {
        const timeLine = timeInfo.join(' | ');
        console.log(ctx.noColor ? `  ${timeLine}` : colors.dim(`  ${timeLine}`));
      }

      // ID
      const idLine = `ID: ${booking.id}`;
      console.log(ctx.noColor ? `  ${idLine}` : colors.dim(`  ${idLine}`));
      console.log();
    }
  }
}

/**
 * Render a single booking detail in human-readable format
 */
export class HumanBookingDetailRenderer implements Renderer<FormattedBooking> {
  render(booking: FormattedBooking, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();

    // Status
    let status = booking.draft ? '[TENTATIVE]' : '[CONFIRMED]';
    let statusColored = booking.draft
      ? ctx.noColor
        ? status
        : colors.yellow(status)
      : ctx.noColor
        ? status
        : colors.green(status);

    if (booking.rejected_at) {
      status = '[REJECTED]';
      statusColored = ctx.noColor ? status : colors.red(status);
    } else if (booking.approved_at) {
      status = '[APPROVED]';
      statusColored = ctx.noColor ? status : colors.green(status);
    }

    console.log(statusColored);
    console.log();

    console.log(label('ID:'), booking.id);
    console.log(label('Period:'), `${booking.started_on} → ${booking.ended_on}`);
    console.log(label('Method:'), booking.booking_method);

    if (booking.person_name) {
      console.log(label('Person:'), booking.person_name);
    }

    if (booking.service_name) {
      console.log(label('Service:'), booking.service_name);
    }

    if (booking.event_id) {
      console.log(label('Event ID:'), booking.event_id);
    }

    if (booking.time) {
      console.log(label('Time/day:'), formatDuration(booking.time));
    }

    if (booking.total_time) {
      console.log(label('Total time:'), formatDuration(booking.total_time));
    }

    if (booking.percentage) {
      console.log(label('Percentage:'), `${booking.percentage}%`);
    }

    if (booking.note) {
      console.log(label('Note:'), booking.note);
    }

    if (booking.rejected_reason) {
      console.log(label('Rejection reason:'), booking.rejected_reason);
    }

    if (booking.approved_at) {
      console.log(label('Approved at:'), booking.approved_at.split('T')[0]);
    }

    if (booking.created_at) {
      console.log(label('Created:'), booking.created_at.split('T')[0]);
    }

    console.log();
  }
}

// Singleton instances
export const humanBookingListRenderer = new HumanBookingListRenderer();
export const humanBookingDetailRenderer = new HumanBookingDetailRenderer();
