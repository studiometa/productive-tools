/**
 * Human-readable renderers for Comment resources
 */

import type { FormattedComment, FormattedListResponse } from '@studiometa/productive-api';

import type { RenderContext, ListRenderer, Renderer } from '../types.js';

import { colors } from '../../utils/colors.js';

/**
 * Render a list of comments in human-readable format
 */
export class HumanCommentListRenderer implements ListRenderer<FormattedComment> {
  render(data: FormattedListResponse<FormattedComment>, ctx: RenderContext): void {
    const { data: comments, meta } = data;

    if (comments.length === 0) {
      console.log(ctx.noColor ? 'No comments found' : colors.dim('No comments found'));
      return;
    }

    // Header
    if (meta) {
      const pageInfo = `Page ${meta.page}/${meta.total_pages} (${meta.total_count} total)`;
      console.log(ctx.noColor ? pageInfo : colors.dim(pageInfo));
      console.log();
    }

    // List comments
    for (const comment of comments) {
      // Author and date
      const author = comment.creator_name || 'Unknown';
      const date = comment.created_at ? comment.created_at.split('T')[0] : '';
      const header = `${author} on ${date}`;
      console.log(ctx.noColor ? header : colors.bold(header));

      // Comment type badge
      const typeBadge = `[${comment.commentable_type}]`;
      console.log(ctx.noColor ? `  ${typeBadge}` : colors.dim(`  ${typeBadge}`));

      // Body preview
      const bodyPreview = comment.body.substring(0, 120).replace(/\n/g, ' ');
      const truncated = comment.body.length > 120 ? '...' : '';
      console.log(`  ${bodyPreview}${truncated}`);

      // ID
      const idLine = `ID: ${comment.id}`;
      console.log(ctx.noColor ? `  ${idLine}` : colors.dim(`  ${idLine}`));
      console.log();
    }
  }
}

/**
 * Render a single comment detail in human-readable format
 */
export class HumanCommentDetailRenderer implements Renderer<FormattedComment> {
  render(comment: FormattedComment, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();

    // Author and date
    const author = comment.creator_name || 'Unknown';
    const date = comment.created_at ? comment.created_at.split('T')[0] : '';
    console.log(ctx.noColor ? `${author} on ${date}` : colors.bold(`${author} on ${date}`));

    if (comment.pinned) {
      console.log(ctx.noColor ? '[PINNED]' : colors.yellow('[PINNED]'));
    }
    if (comment.draft) {
      console.log(ctx.noColor ? '[DRAFT]' : colors.dim('[DRAFT]'));
    }
    console.log();

    console.log(label('ID:'), comment.id);
    console.log(label('Type:'), comment.commentable_type);
    console.log();

    console.log(label('Body:'));
    console.log(comment.body);
    console.log();
  }
}

// Singleton instances
export const humanCommentListRenderer = new HumanCommentListRenderer();
export const humanCommentDetailRenderer = new HumanCommentDetailRenderer();
