/**
 * Human-readable renderer for people
 *
 * Displays people with name, email, and status information.
 */

import { colors } from '../../utils/colors.js';
import { linkedPerson } from '../../utils/productive-links.js';
import type { FormattedPerson, FormattedPagination } from '../../formatters/types.js';
import type { ListRenderer, Renderer, RenderContext } from '../types.js';

/**
 * Renderer for a list of people with pagination
 */
export class HumanPersonListRenderer implements ListRenderer<FormattedPerson> {
  render(
    data: { data: FormattedPerson[]; meta?: FormattedPagination },
    ctx: RenderContext
  ): void {
    for (const person of data.data) {
      this.renderItem(person, ctx);
    }

    if (data.meta) {
      this.renderPagination(data.meta, ctx);
    }
  }

  renderItem(person: FormattedPerson, _ctx: RenderContext): void {
    const status = person.active
      ? colors.green('[active]')
      : colors.gray('[inactive]');

    console.log(
      `${colors.bold(person.name)} ${status} ${linkedPerson(person.name, person.id).replace(person.name, colors.dim(`#${person.id}`))}`
    );
    console.log(`  ${colors.dim(person.email)}`);

    if (person.title) {
      console.log(`  ${colors.cyan(person.title)}`);
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
 * Renderer for a single person detail view
 */
export class HumanPersonDetailRenderer implements Renderer<FormattedPerson> {
  render(person: FormattedPerson, _ctx: RenderContext): void {
    console.log(colors.bold(colors.cyan(person.name)));
    console.log(colors.dim('─'.repeat(50)));
    console.log(`${colors.cyan('ID:')}     ${person.id}`);
    console.log(`${colors.cyan('Email:')}  ${person.email}`);
    console.log(
      `${colors.cyan('Status:')} ${person.active ? colors.green('Active') : colors.gray('Inactive')}`
    );

    if (person.title) {
      console.log(`${colors.cyan('Title:')}  ${person.title}`);
    }

    if (person.created_at) {
      console.log(
        `${colors.cyan('Created:')} ${new Date(person.created_at).toLocaleString()}`
      );
    }

    if (person.updated_at) {
      console.log(
        `${colors.cyan('Updated:')} ${new Date(person.updated_at).toLocaleString()}`
      );
    }
  }
}

/**
 * Singleton instances for convenience
 */
export const humanPersonListRenderer = new HumanPersonListRenderer();
export const humanPersonDetailRenderer = new HumanPersonDetailRenderer();
