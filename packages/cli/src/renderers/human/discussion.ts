/**
 * Human-readable renderers for Discussion resources
 */

import type { FormattedDiscussion, FormattedListResponse } from '@studiometa/productive-api';

import type { RenderContext, ListRenderer, Renderer } from '../types.js';

import { colors } from '../../utils/colors.js';

function statusBadge(status: string, noColor: boolean): string {
  if (noColor) return `[${status.toUpperCase()}]`;
  return status === 'resolved' ? colors.green(`[RESOLVED]`) : colors.yellow(`[ACTIVE]`);
}

/**
 * Render a list of discussions in human-readable format
 */
export class HumanDiscussionListRenderer implements ListRenderer<FormattedDiscussion> {
  render(data: FormattedListResponse<FormattedDiscussion>, ctx: RenderContext): void {
    const { data: discussions, meta } = data;

    if (discussions.length === 0) {
      console.log(ctx.noColor ? 'No discussions found' : colors.dim('No discussions found'));
      return;
    }

    if (meta) {
      const pageInfo = `Page ${meta.page}/${meta.total_pages} (${meta.total_count} total)`;
      console.log(ctx.noColor ? pageInfo : colors.dim(pageInfo));
      console.log();
    }

    for (const discussion of discussions) {
      const title = discussion.title || 'Untitled discussion';
      const badge = statusBadge(discussion.status, ctx.noColor);
      console.log(ctx.noColor ? `${title} ${badge}` : `${colors.bold(title)} ${badge}`);

      if (discussion.body) {
        const bodyPreview = discussion.body.substring(0, 120).replace(/\n/g, ' ');
        const truncated = discussion.body.length > 120 ? '...' : '';
        console.log(`  ${bodyPreview}${truncated}`);
      }

      const idLine = `ID: ${discussion.id}`;
      console.log(ctx.noColor ? `  ${idLine}` : colors.dim(`  ${idLine}`));
      console.log();
    }
  }
}

/**
 * Render a single discussion detail in human-readable format
 */
export class HumanDiscussionDetailRenderer implements Renderer<FormattedDiscussion> {
  render(discussion: FormattedDiscussion, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();
    const title = discussion.title || 'Untitled discussion';
    const badge = statusBadge(discussion.status, ctx.noColor);
    console.log(ctx.noColor ? `${title} ${badge}` : `${colors.bold(title)} ${badge}`);
    console.log();

    console.log(label('ID:'), discussion.id);

    if (discussion.page_id) {
      console.log(label('Page ID:'), discussion.page_id);
    }

    if (discussion.resolved_at) {
      console.log(label('Resolved at:'), discussion.resolved_at.split('T')[0]);
    }
    console.log();

    if (discussion.body) {
      console.log(label('Body:'));
      console.log(discussion.body);
      console.log();
    }

    if (discussion.created_at) {
      console.log(label('Created:'), discussion.created_at.split('T')[0]);
    }
    if (discussion.updated_at) {
      console.log(label('Updated:'), discussion.updated_at.split('T')[0]);
    }
    console.log();
  }
}

export const humanDiscussionListRenderer = new HumanDiscussionListRenderer();
export const humanDiscussionDetailRenderer = new HumanDiscussionDetailRenderer();
