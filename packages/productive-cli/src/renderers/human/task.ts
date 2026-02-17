/**
 * Human-readable renderer for tasks
 *
 * Displays tasks with status, assignee, project, and time tracking info.
 */

import type { FormattedTask, FormattedPagination } from '@studiometa/productive-api';

import type { ListRenderer, Renderer, RenderContext } from '../types.js';

import { colors } from '../../utils/colors.js';
import { linkedId, linkedProject, linkedPerson } from '../../utils/productive-links.js';

/**
 * Format time in minutes to human readable format
 */
export function formatTime(minutes: number | undefined): string {
  if (minutes === undefined || minutes === null) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins}m`;
}

/**
 * Renderer for a list of tasks with pagination
 */
export class HumanTaskListRenderer implements ListRenderer<FormattedTask> {
  render(data: { data: FormattedTask[]; meta?: FormattedPagination }, ctx: RenderContext): void {
    for (const task of data.data) {
      this.renderItem(task, ctx);
    }

    if (data.meta) {
      this.renderPagination(data.meta, ctx);
    }
  }

  renderItem(task: FormattedTask, _ctx: RenderContext): void {
    const isClosed = task.closed;
    const statusIcon = isClosed ? colors.green('✓') : colors.yellow('○');
    const title = task.title || 'Untitled';
    const taskNumber = task.number ? `#${task.number}` : '';

    const numberPart = taskNumber ? colors.dim(taskNumber) + ' ' : '';
    console.log(`${statusIcon} ${numberPart}${colors.bold(title)} ${linkedId(task.id, 'task')}`);

    // Project and assignee info
    const parts: string[] = [];
    if (task.project_name) {
      const projectName = colors.cyan(task.project_name);
      parts.push(task.project_id ? linkedProject(projectName, task.project_id) : projectName);
    }
    if (task.assignee_name) {
      const assigneeText = task.assignee_id
        ? linkedPerson(task.assignee_name, task.assignee_id)
        : task.assignee_name;
      parts.push(`${colors.dim('→')} ${assigneeText}`);
    }
    if (task.status_name) {
      parts.push(colors.dim(`[${task.status_name}]`));
    }
    if (parts.length > 0) {
      console.log(`  ${parts.join(' ')}`);
    }

    // Time tracking info
    const timeInfo: string[] = [];
    const worked = task.worked_time;
    const estimate = task.initial_estimate;

    if (worked !== undefined && worked > 0) {
      const workedStr = formatTime(worked);
      if (estimate !== undefined && estimate > 0) {
        const estimateStr = formatTime(estimate);
        const isOverBudget = worked > estimate;
        const ratio = `${workedStr}/${estimateStr}`;
        timeInfo.push(`${colors.dim('Time:')} ${isOverBudget ? colors.red(ratio) : ratio}`);
      } else {
        timeInfo.push(`${colors.dim('Time:')} ${workedStr}`);
      }
    } else if (estimate !== undefined && estimate > 0) {
      timeInfo.push(`${colors.dim('Est:')} ${formatTime(estimate)}`);
    }

    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const now = new Date();
      const isOverdue = !isClosed && dueDate < now;
      const dueDateStr = task.due_date;
      timeInfo.push(`${colors.dim('Due:')} ${isOverdue ? colors.red(dueDateStr) : dueDateStr}`);
    }

    if (timeInfo.length > 0) {
      console.log(`  ${timeInfo.join('  ')}`);
    }

    console.log();
  }

  renderPagination(meta: FormattedPagination, _ctx: RenderContext): void {
    console.log(
      colors.dim(`Page ${meta.page}/${meta.total_pages} (Total: ${meta.total_count} tasks)`),
    );
  }
}

/**
 * Renderer for a single task detail view
 */
export class HumanTaskDetailRenderer implements Renderer<FormattedTask> {
  render(task: FormattedTask, _ctx: RenderContext): void {
    const isClosed = task.closed;
    const statusIcon = isClosed ? colors.green('✓ Completed') : colors.yellow('○ Active');
    const taskNumber = task.number ? colors.dim(`#${task.number} `) : '';

    console.log(`${taskNumber}${colors.bold(task.title)}`);
    console.log(colors.dim('─'.repeat(50)));
    console.log(`${colors.cyan('ID:')}       ${linkedId(task.id, 'task')}`);
    console.log(`${colors.cyan('Status:')}   ${statusIcon}`);

    if (task.status_name) {
      console.log(`${colors.cyan('Workflow:')} ${colors.dim(`[${task.status_name}]`)}`);
    }

    if (task.project_name) {
      const projectText = task.project_id
        ? linkedProject(task.project_name, task.project_id)
        : task.project_name;
      console.log(`${colors.cyan('Project:')}  ${projectText}`);
    }

    if (task.assignee_name) {
      const assigneeText = task.assignee_id
        ? linkedPerson(task.assignee_name, task.assignee_id)
        : task.assignee_name;
      console.log(`${colors.cyan('Assignee:')} ${assigneeText}`);
    }

    // Time tracking
    const worked = task.worked_time;
    const estimate = task.initial_estimate;

    if (worked !== undefined && worked > 0) {
      const workedStr = formatTime(worked);
      if (estimate !== undefined && estimate > 0) {
        const estimateStr = formatTime(estimate);
        const isOverBudget = worked > estimate;
        const ratio = `${workedStr} / ${estimateStr}`;
        console.log(`${colors.cyan('Time:')}     ${isOverBudget ? colors.red(ratio) : ratio}`);
      } else {
        console.log(`${colors.cyan('Time:')}     ${workedStr}`);
      }
    } else if (estimate !== undefined && estimate > 0) {
      console.log(`${colors.cyan('Estimate:')} ${formatTime(estimate)}`);
    }

    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const now = new Date();
      const isOverdue = !isClosed && dueDate < now;
      const dueDateStr = task.due_date;
      console.log(`${colors.cyan('Due:')}      ${isOverdue ? colors.red(dueDateStr) : dueDateStr}`);
    }

    // Description
    if (task.description) {
      console.log();
      console.log(`${colors.cyan('Description:')}`);
      const lines = task.description.split('\n').map((line) => `  ${line}`);
      console.log(lines.join('\n'));
    }

    // Timestamps
    console.log();
    if (task.created_at) {
      console.log(`${colors.dim('Created:')} ${new Date(task.created_at).toLocaleString()}`);
    }
    if (task.updated_at) {
      console.log(`${colors.dim('Updated:')} ${new Date(task.updated_at).toLocaleString()}`);
    }
  }
}

/**
 * Singleton instances for convenience
 */
export const humanTaskListRenderer = new HumanTaskListRenderer();
export const humanTaskDetailRenderer = new HumanTaskDetailRenderer();
