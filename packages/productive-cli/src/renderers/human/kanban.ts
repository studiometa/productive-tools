/**
 * Kanban board renderer for tasks
 *
 * Displays tasks grouped by workflow status in a multi-column board layout.
 */

import type { FormattedTask, FormattedPagination } from '@studiometa/productive-api';

import type { ListRenderer, RenderContext } from '../types.js';

import { colors } from '../../utils/colors.js';
import { linkedId } from '../../utils/productive-links.js';

/**
 * Strip ANSI codes for length calculation
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m|\x1b\]8;;[^\x1b]*\x1b\\|\x1b\]8;;\x1b\\/g, '');
}

/**
 * Truncate text to fit width (accounting for ANSI codes)
 */
function truncateText(text: string, maxWidth: number): string {
  const visibleLength = stripAnsi(text).length;
  if (visibleLength <= maxWidth) return text;

  // Simple truncation - find where to cut
  let visibleCount = 0;
  let cutIndex = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\x1b') {
      // Skip ANSI sequence
      const endBracket = text.indexOf('m', i);
      const endOsc = text.indexOf('\\', i);
      if (endBracket !== -1 && (endOsc === -1 || endBracket < endOsc)) {
        i = endBracket;
      } else if (endOsc !== -1) {
        i = endOsc;
      }
      continue;
    }
    visibleCount++;
    if (visibleCount >= maxWidth - 1) {
      cutIndex = i;
      break;
    }
  }
  return text.slice(0, cutIndex) + '…\x1b[0m';
}

/**
 * Pad text to width (accounting for ANSI codes)
 */
function padText(text: string, width: number): string {
  const visibleLength = stripAnsi(text).length;
  if (visibleLength >= width) return text;
  return text + ' '.repeat(width - visibleLength);
}

/**
 * Kanban task representation
 */
interface KanbanTask {
  id: string;
  number?: number;
  title: string;
  assignee?: string;
  statusId?: string;
  statusName?: string;
}

/**
 * Kanban column representation
 */
interface KanbanColumn {
  id: string;
  name: string;
  tasks: KanbanTask[];
}

/**
 * Kanban board renderer - displays tasks in columns by status
 */
export class KanbanRenderer implements ListRenderer<FormattedTask> {
  render(data: { data: FormattedTask[]; meta?: FormattedPagination }, ctx: RenderContext): void {
    const columns = this.buildColumns(data.data);
    this.renderBoard(columns, ctx.terminalWidth);

    if (data.meta) {
      this.renderPagination(data.meta, ctx);
    }
  }

  renderPagination(meta: FormattedPagination, _ctx: RenderContext): void {
    console.log();
    console.log(colors.dim(`Total: ${meta.total_count} tasks`));
  }

  /**
   * Build kanban columns from tasks
   */
  private buildColumns(tasks: FormattedTask[]): KanbanColumn[] {
    const statusMap = new Map<string, KanbanColumn>();
    const defaultColumn: KanbanColumn = {
      id: 'unknown',
      name: 'No Status',
      tasks: [],
    };

    for (const task of tasks) {
      const statusId = task.status_id;
      const statusName = task.status_name;

      const kanbanTask: KanbanTask = {
        id: task.id,
        number: task.number,
        title: task.title || 'Untitled',
        assignee: task.assignee_name,
        statusId,
        statusName,
      };

      if (statusName) {
        if (!statusMap.has(statusName)) {
          statusMap.set(statusName, {
            id: statusId || statusName,
            name: statusName,
            tasks: [],
          });
        }
        statusMap.get(statusName)!.tasks.push(kanbanTask);
      } else {
        defaultColumn.tasks.push(kanbanTask);
      }
    }

    const columns = Array.from(statusMap.values())
      .slice()
      .toSorted((a, b) => a.name.localeCompare(b.name));

    if (defaultColumn.tasks.length > 0) {
      columns.push(defaultColumn);
    }

    return columns;
  }

  /**
   * Render the kanban board
   */
  private renderBoard(columns: KanbanColumn[], terminalWidth: number): void {
    if (columns.length === 0) {
      console.log(colors.dim('No columns to display'));
      return;
    }

    const columnGap = 2;
    const minColumnWidth = 20;
    const maxColumnWidth = 40;

    // Calculate column width based on terminal width and number of columns
    const availableWidth = terminalWidth - (columns.length - 1) * columnGap;
    let columnWidth = Math.floor(availableWidth / columns.length);
    columnWidth = Math.max(minColumnWidth, Math.min(maxColumnWidth, columnWidth));

    // Render header row
    const headers = columns.map((col) => {
      const countBadge = colors.dim(`(${col.tasks.length})`);
      const headerText = `${colors.bold(col.name)} ${countBadge}`;
      return padText(truncateText(headerText, columnWidth), columnWidth);
    });
    console.log(headers.join(' '.repeat(columnGap)));

    // Render separator
    const separators = columns.map(() => colors.dim('─'.repeat(columnWidth)));
    console.log(separators.join(' '.repeat(columnGap)));

    // Find max tasks in any column
    const maxTasks = Math.max(...columns.map((col) => col.tasks.length), 0);

    // Render tasks row by row
    for (let taskIndex = 0; taskIndex < maxTasks; taskIndex++) {
      // Task title line
      const titleLine = columns.map((col) => {
        const task = col.tasks[taskIndex];
        if (!task) return ' '.repeat(columnWidth);

        const numberPart = task.number
          ? linkedId(task.id, 'task').replace(`#${task.id}`, `#${task.number}`) + ' '
          : '';
        const titleText = `${numberPart}${task.title}`;
        return padText(truncateText(titleText, columnWidth), columnWidth);
      });
      console.log(titleLine.join(' '.repeat(columnGap)));

      // Task assignee line
      const assigneeLine = columns.map((col) => {
        const task = col.tasks[taskIndex];
        if (!task) return ' '.repeat(columnWidth);

        if (task.assignee) {
          const assigneeText = colors.dim(`  → ${task.assignee}`);
          return padText(truncateText(assigneeText, columnWidth), columnWidth);
        }
        return ' '.repeat(columnWidth);
      });

      // Only print if there's content
      if (assigneeLine.some((line) => line.trim() !== '')) {
        console.log(assigneeLine.join(' '.repeat(columnGap)));
      }

      // Empty line between tasks
      if (taskIndex < maxTasks - 1) {
        console.log(columns.map(() => ' '.repeat(columnWidth)).join(' '.repeat(columnGap)));
      }
    }
  }
}

/**
 * Singleton instance for convenience
 */
export const kanbanRenderer = new KanbanRenderer();

// Re-export helpers for testing
export { stripAnsi, truncateText, padText };
export type { KanbanTask, KanbanColumn };
