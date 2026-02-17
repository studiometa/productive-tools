/**
 * Human-readable renderers for Page resources
 */

import type { FormattedPage, FormattedListResponse } from '@studiometa/productive-api';

import type { RenderContext, ListRenderer, Renderer } from '../types.js';

import { colors } from '../../utils/colors.js';

/**
 * Render a list of pages in human-readable format
 */
export class HumanPageListRenderer implements ListRenderer<FormattedPage> {
  render(data: FormattedListResponse<FormattedPage>, ctx: RenderContext): void {
    const { data: pages, meta } = data;

    if (pages.length === 0) {
      console.log(ctx.noColor ? 'No pages found' : colors.dim('No pages found'));
      return;
    }

    if (meta) {
      const pageInfo = `Page ${meta.page}/${meta.total_pages} (${meta.total_count} total)`;
      console.log(ctx.noColor ? pageInfo : colors.dim(pageInfo));
      console.log();
    }

    for (const page of pages) {
      const title = page.title || 'Untitled';
      const publicBadge = page.public ? ' [PUBLIC]' : '';
      console.log(
        ctx.noColor
          ? `${title}${publicBadge}`
          : colors.bold(title) + (page.public ? colors.green(' [PUBLIC]') : ''),
      );

      // Body preview
      if (page.body) {
        const bodyPreview = page.body.substring(0, 120).replace(/\n/g, ' ');
        const truncated = page.body.length > 120 ? '...' : '';
        console.log(`  ${bodyPreview}${truncated}`);
      }

      const idLine = `ID: ${page.id}`;
      console.log(ctx.noColor ? `  ${idLine}` : colors.dim(`  ${idLine}`));
      console.log();
    }
  }
}

/**
 * Render a single page detail in human-readable format
 */
export class HumanPageDetailRenderer implements Renderer<FormattedPage> {
  render(page: FormattedPage, ctx: RenderContext): void {
    const label = (text: string) => (ctx.noColor ? text : colors.cyan(text));

    console.log();
    console.log(ctx.noColor ? page.title : colors.bold(page.title));

    if (page.public) {
      console.log(ctx.noColor ? '[PUBLIC]' : colors.green('[PUBLIC]'));
    }
    console.log();

    console.log(label('ID:'), page.id);

    if (page.project_id) {
      console.log(label('Project ID:'), page.project_id);
    }
    if (page.parent_page_id) {
      console.log(label('Parent page ID:'), page.parent_page_id);
    }
    if (page.version_number !== undefined) {
      console.log(label('Version:'), page.version_number);
    }
    console.log();

    if (page.body) {
      console.log(label('Body:'));
      console.log(page.body);
      console.log();
    }

    if (page.created_at) {
      console.log(label('Created:'), page.created_at.split('T')[0]);
    }
    if (page.updated_at) {
      console.log(label('Updated:'), page.updated_at.split('T')[0]);
    }
    console.log();
  }
}

export const humanPageListRenderer = new HumanPageListRenderer();
export const humanPageDetailRenderer = new HumanPageDetailRenderer();
