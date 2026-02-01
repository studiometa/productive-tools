/**
 * Human-readable renderer for services
 *
 * Displays services with name and time budget information.
 */

import { colors } from '../../utils/colors.js';
import { linkedId } from '../../utils/productive-links.js';
import type { FormattedService, FormattedPagination } from '../../formatters/types.js';
import type { ListRenderer, RenderContext } from '../types.js';

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
 * Renderer for a list of services with pagination
 */
export class HumanServiceListRenderer implements ListRenderer<FormattedService> {
  render(
    data: { data: FormattedService[]; meta?: FormattedPagination },
    ctx: RenderContext
  ): void {
    for (const service of data.data) {
      this.renderItem(service, ctx);
    }

    if (data.meta) {
      this.renderPagination(data.meta, ctx);
    }
  }

  renderItem(service: FormattedService, _ctx: RenderContext): void {
    console.log(
      `${colors.bold(service.name)} ${linkedId(service.id, 'service')}`
    );

    const timeInfo: string[] = [];

    if (service.budgeted_time !== undefined) {
      timeInfo.push(`${colors.dim('Budget:')} ${formatTime(service.budgeted_time)}`);
    }

    if (service.worked_time !== undefined) {
      const worked = formatTime(service.worked_time);
      if (service.budgeted_time !== undefined && service.worked_time > service.budgeted_time) {
        timeInfo.push(`${colors.dim('Worked:')} ${colors.red(worked)}`);
      } else {
        timeInfo.push(`${colors.dim('Worked:')} ${worked}`);
      }
    }

    if (timeInfo.length > 0) {
      console.log(`  ${timeInfo.join('  ')}`);
    }

    console.log();
  }

  renderPagination(meta: FormattedPagination, _ctx: RenderContext): void {
    console.log(
      colors.dim(
        `Page ${meta.page}/${meta.total_pages} (Total: ${meta.total_count})`
      )
    );
  }
}

/**
 * Singleton instance for convenience
 */
export const humanServiceListRenderer = new HumanServiceListRenderer();
