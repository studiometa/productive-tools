/**
 * Human-readable renderers for Deal resources
 */

import type { FormattedDeal, FormattedListResponse } from '../../formatters/types.js';
import type { RenderContext, ListRenderer, Renderer } from '../types.js';

import { colors } from '../../utils/colors.js';

/**
 * Render a list of deals in human-readable format
 */
export class HumanDealListRenderer implements ListRenderer<FormattedDeal> {
  render(data: FormattedListResponse<FormattedDeal>, ctx: RenderContext): void {
    const { data: deals, meta } = data;

    if (deals.length === 0) {
      console.log(ctx.noColor ? 'No deals found' : colors.dim('No deals found'));
      return;
    }

    // Header
    if (meta) {
      const pageInfo = `Page ${meta.page}/${meta.total_pages} (${meta.total_count} total)`;
      console.log(ctx.noColor ? pageInfo : colors.dim(pageInfo));
      console.log();
    }

    // List deals
    for (const deal of deals) {
      // Type badge
      const typeBadge = deal.type === 'budget' ? '[BUDGET]' : '[DEAL]';
      const typeColored =
        deal.type === 'budget'
          ? ctx.noColor
            ? typeBadge
            : colors.blue(typeBadge)
          : ctx.noColor
            ? typeBadge
            : colors.green(typeBadge);

      // Status indicators
      let statusBadge = '';
      if (deal.won_at) {
        statusBadge = ctx.noColor ? ' [WON]' : colors.green(' [WON]');
      } else if (deal.lost_at) {
        statusBadge = ctx.noColor ? ' [LOST]' : colors.red(' [LOST]');
      }

      // Number
      const numberStr = deal.number ? `#${deal.number} ` : '';

      console.log(
        `${typeColored} ${ctx.noColor ? numberStr + deal.name : colors.bold(numberStr + deal.name)}${statusBadge}`,
      );

      // Company and responsible
      const details: string[] = [];
      if (deal.company_name) details.push(`Company: ${deal.company_name}`);
      if (deal.responsible_name) details.push(`Responsible: ${deal.responsible_name}`);
      if (deal.status_name) details.push(`Status: ${deal.status_name}`);

      if (details.length > 0) {
        const detailLine = details.join(' | ');
        console.log(ctx.noColor ? `  ${detailLine}` : colors.dim(`  ${detailLine}`));
      }

      // Dates
      if (deal.date) {
        const dateInfo = deal.end_date ? `${deal.date} → ${deal.end_date}` : `Starts: ${deal.date}`;
        console.log(ctx.noColor ? `  ${dateInfo}` : colors.dim(`  ${dateInfo}`));
      }

      // ID
      const idLine = `ID: ${deal.id}`;
      console.log(ctx.noColor ? `  ${idLine}` : colors.dim(`  ${idLine}`));
      console.log();
    }
  }
}

/**
 * Render a single deal detail in human-readable format
 */
export class HumanDealDetailRenderer implements Renderer<FormattedDeal> {
  render(deal: FormattedDeal, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();

    // Type badge
    const typeBadge = deal.type === 'budget' ? '[BUDGET]' : '[DEAL]';
    const typeColored =
      deal.type === 'budget'
        ? ctx.noColor
          ? typeBadge
          : colors.blue(typeBadge)
        : ctx.noColor
          ? typeBadge
          : colors.green(typeBadge);

    // Number and name
    const numberStr = deal.number ? `#${deal.number} ` : '';
    console.log(
      `${typeColored} ${ctx.noColor ? numberStr + deal.name : colors.bold(numberStr + deal.name)}`,
    );

    // Status indicators
    if (deal.won_at) {
      console.log(ctx.noColor ? '[WON]' : colors.green('[WON]'));
    } else if (deal.lost_at) {
      console.log(ctx.noColor ? '[LOST]' : colors.red('[LOST]'));
    }
    console.log();

    console.log(label('ID:'), deal.id);

    if (deal.company_name) {
      console.log(label('Company:'), deal.company_name);
    }

    if (deal.responsible_name) {
      console.log(label('Responsible:'), deal.responsible_name);
    }

    if (deal.status_name) {
      console.log(label('Status:'), deal.status_name);
    }

    if (deal.date) {
      console.log(label('Start date:'), deal.date);
    }

    if (deal.end_date) {
      console.log(label('End date:'), deal.end_date);
    }

    if (deal.won_at) {
      console.log(label('Won at:'), deal.won_at.split('T')[0]);
    }

    if (deal.lost_at) {
      console.log(label('Lost at:'), deal.lost_at.split('T')[0]);
    }

    if (deal.created_at) {
      console.log(label('Created:'), deal.created_at.split('T')[0]);
    }

    console.log();
  }
}

// Singleton instances
export const humanDealListRenderer = new HumanDealListRenderer();
export const humanDealDetailRenderer = new HumanDealDetailRenderer();
