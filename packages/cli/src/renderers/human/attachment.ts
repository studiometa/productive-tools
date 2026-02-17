/**
 * Human-readable renderers for Attachment resources
 */

import type { FormattedAttachment, FormattedListResponse } from '@studiometa/productive-api';

import type { RenderContext, ListRenderer, Renderer } from '../types.js';

import { colors } from '../../utils/colors.js';

/**
 * Render a list of attachments in human-readable format
 */
export class HumanAttachmentListRenderer implements ListRenderer<FormattedAttachment> {
  render(data: FormattedListResponse<FormattedAttachment>, ctx: RenderContext): void {
    const { data: attachments, meta } = data;

    if (attachments.length === 0) {
      console.log(ctx.noColor ? 'No attachments found' : colors.dim('No attachments found'));
      return;
    }

    // Header
    if (meta) {
      const pageInfo = `Page ${meta.page}/${meta.total_pages} (${meta.total_count} total)`;
      console.log(ctx.noColor ? pageInfo : colors.dim(pageInfo));
      console.log();
    }

    // List attachments
    for (const attachment of attachments) {
      const name = attachment.name || 'Unnamed';
      console.log(ctx.noColor ? name : colors.bold(name));

      const details = `${attachment.content_type} · ${attachment.size_human}`;
      console.log(ctx.noColor ? `  ${details}` : colors.dim(`  ${details}`));

      if (attachment.attachable_type) {
        const typeBadge = `[${attachment.attachable_type}]`;
        console.log(ctx.noColor ? `  ${typeBadge}` : colors.dim(`  ${typeBadge}`));
      }

      const idLine = `ID: ${attachment.id}`;
      console.log(ctx.noColor ? `  ${idLine}` : colors.dim(`  ${idLine}`));
      console.log();
    }
  }
}

/**
 * Render a single attachment detail in human-readable format
 */
export class HumanAttachmentDetailRenderer implements Renderer<FormattedAttachment> {
  render(attachment: FormattedAttachment, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();
    console.log(ctx.noColor ? attachment.name : colors.bold(attachment.name));
    console.log();

    console.log(label('ID:'), attachment.id);
    console.log(label('Type:'), attachment.content_type);
    console.log(label('Size:'), attachment.size_human);
    console.log(label('URL:'), attachment.url);

    if (attachment.attachable_type) {
      console.log(label('Attached to:'), attachment.attachable_type);
    }

    if (attachment.created_at) {
      console.log(label('Created:'), attachment.created_at.split('T')[0]);
    }

    console.log();
  }
}

// Singleton instances
export const humanAttachmentListRenderer = new HumanAttachmentListRenderer();
export const humanAttachmentDetailRenderer = new HumanAttachmentDetailRenderer();
