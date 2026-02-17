/**
 * Human-readable renderer for projects
 *
 * Displays projects with name, status, and budget information.
 */

import type { FormattedProject, FormattedPagination } from '@studiometa/productive-api';

import type { ListRenderer, Renderer, RenderContext } from '../types.js';

import { colors } from '../../utils/colors.js';
import { linkedId } from '../../utils/productive-links.js';

/**
 * Renderer for a list of projects with pagination
 */
export class HumanProjectListRenderer implements ListRenderer<FormattedProject> {
  render(data: { data: FormattedProject[]; meta?: FormattedPagination }, ctx: RenderContext): void {
    for (const project of data.data) {
      this.renderItem(project, ctx);
    }

    if (data.meta) {
      this.renderPagination(data.meta, ctx);
    }
  }

  renderItem(project: FormattedProject, _ctx: RenderContext): void {
    const status = project.archived ? colors.gray('[archived]') : colors.green('[active]');

    console.log(`${colors.bold(project.name)} ${status} ${linkedId(project.id, 'project')}`);

    if (project.number) {
      console.log(colors.dim(`  Number: ${project.number}`));
    }
    if (project.budget) {
      console.log(colors.dim(`  Budget: ${project.budget}`));
    }
    console.log();
  }

  renderPagination(meta: FormattedPagination, _ctx: RenderContext): void {
    console.log(colors.dim(`Page ${meta.page}/${meta.total_pages} (Total: ${meta.total_count})`));
  }
}

/**
 * Renderer for a single project detail view
 */
export class HumanProjectDetailRenderer implements Renderer<FormattedProject> {
  render(project: FormattedProject, _ctx: RenderContext): void {
    console.log(colors.bold(colors.cyan(project.name)));
    console.log(colors.dim('─'.repeat(50)));
    console.log(`${colors.cyan('ID:')}      ${linkedId(project.id, 'project')}`);

    if (project.number) {
      console.log(`${colors.cyan('Number:')}  ${project.number}`);
    }

    console.log(
      `${colors.cyan('Status:')}  ${project.archived ? colors.gray('Archived') : colors.green('Active')}`,
    );

    if (project.budget) {
      console.log(`${colors.cyan('Budget:')}  ${project.budget}`);
    }

    if (project.created_at) {
      console.log(`${colors.cyan('Created:')} ${new Date(project.created_at).toLocaleString()}`);
    }

    if (project.updated_at) {
      console.log(`${colors.cyan('Updated:')} ${new Date(project.updated_at).toLocaleString()}`);
    }
  }
}

/**
 * Singleton instances for convenience
 */
export const humanProjectListRenderer = new HumanProjectListRenderer();
export const humanProjectDetailRenderer = new HumanProjectDetailRenderer();
