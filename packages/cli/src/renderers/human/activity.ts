/**
 * Human-readable renderer for activities
 *
 * Displays activity feed entries with event type, timestamp, creator, and changeset.
 */

import type { FormattedActivity, FormattedPagination } from '@studiometa/productive-api';

import type { ListRenderer, RenderContext } from '../types.js';

import { colors } from '../../utils/colors.js';

const EVENT_COLORS: Record<string, (s: string) => string> = {
  create: colors.green,
  update: colors.yellow,
  delete: colors.red,
};

/**
 * Format an ISO timestamp as a short local date+time string.
 */
function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const date = d.toISOString().slice(0, 10);
    const time = d.toISOString().slice(11, 16);
    return `${date} ${time}`;
  } catch {
    return isoStr;
  }
}

/**
 * Renderer for a list of activities with pagination
 */
export class HumanActivityListRenderer implements ListRenderer<FormattedActivity> {
  render(
    data: { data: FormattedActivity[]; meta?: FormattedPagination },
    ctx: RenderContext,
  ): void {
    for (const activity of data.data) {
      this.renderItem(activity, ctx);
    }

    if (data.meta) {
      this.renderPagination(data.meta, ctx);
    }
  }

  renderItem(activity: FormattedActivity, _ctx: RenderContext): void {
    const eventColor = EVENT_COLORS[activity.event] ?? ((s: string) => s);
    const eventLabel = eventColor(`[${activity.event}]`);
    const timestamp = colors.dim(formatTimestamp(activity.created_at));
    const creator = activity.creator_name ? ` by ${colors.cyan(activity.creator_name)}` : '';

    console.log(`${eventLabel} ${timestamp}${creator}`);

    if (activity.changeset) {
      console.log(`  ${colors.dim(activity.changeset)}`);
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
export const humanActivityListRenderer = new HumanActivityListRenderer();
