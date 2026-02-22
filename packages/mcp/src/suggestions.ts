/**
 * Proactive suggestion generators for MCP responses.
 *
 * Data-aware warnings and recommendations computed from response data.
 * Different from `_hints` (which show related resources/actions):
 * - `_hints` tell the agent *what to fetch next*
 * - `_suggestions` tell the agent *what to pay attention to*
 *
 * Key design constraints:
 * - No extra API calls — compute only from data already in the response.
 * - Return `string[]` (human-readable messages).
 * - Emoji prefixes: ⚠️ warnings, ℹ️ info, 📊 stats, ⏱️ timers.
 */

import type { JsonApiResource } from '@studiometa/productive-api';
import type { MyDaySummaryResult } from '@studiometa/productive-core';

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get suggestions for tasks.list response.
 *
 * - Warns about overdue tasks (due_date < today and not closed)
 * - Informs about unassigned tasks
 */
export function getTaskListSuggestions(tasks: JsonApiResource[]): string[] {
  const suggestions: string[] = [];
  if (!tasks || tasks.length === 0) return suggestions;

  const today = getToday();

  let overdueCount = 0;
  let unassignedCount = 0;

  for (const task of tasks) {
    const attrs = task.attributes as Record<string, unknown>;
    const relationships = task.relationships as Record<string, unknown> | undefined;

    // Check overdue: due_date exists, is before today, and task is not closed
    const dueDate = attrs.due_date as string | undefined;
    const closed = attrs.closed as boolean | undefined;
    const closedAt = attrs.closed_at as string | undefined;
    if (dueDate && dueDate < today && !closed && !closedAt) {
      overdueCount++;
    }

    // Check unassigned: assignee relationship is absent or null
    const assignee = (relationships?.assignee as { data?: unknown } | undefined)?.data;
    if (!assignee) {
      unassignedCount++;
    }
  }

  if (overdueCount > 0) {
    suggestions.push(`⚠️ ${overdueCount} task(s) are overdue`);
  }

  if (unassignedCount > 0) {
    suggestions.push(`ℹ️ ${unassignedCount} task(s) have no assignee`);
  }

  return suggestions;
}

/**
 * Get suggestions for tasks.get response.
 *
 * - Warns if the single task is overdue (and by how many days)
 * - Informs if no time has been logged (only when time_entries are included)
 */
export function getTaskGetSuggestions(
  task: JsonApiResource,
  included?: JsonApiResource[],
): string[] {
  const suggestions: string[] = [];
  if (!task) return suggestions;

  const attrs = task.attributes as Record<string, unknown>;
  const today = getToday();

  // Check overdue
  const dueDate = attrs.due_date as string | undefined;
  const closed = attrs.closed as boolean | undefined;
  const closedAt = attrs.closed_at as string | undefined;
  if (dueDate && dueDate < today && !closed && !closedAt) {
    const due = new Date(dueDate);
    const now = new Date(today);
    const diffDays = Math.round((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    suggestions.push(`⚠️ Task is ${diffDays} day(s) overdue`);
  }

  // Check no time logged — only if time_entries were included in the response
  if (included && included.length > 0) {
    const taskId = task.id;
    const timeEntries = included.filter((r) => {
      if (r.type !== 'time_entries') return false;
      const rels = r.relationships as Record<string, unknown> | undefined;
      const taskRel = (rels?.task as { data?: { id?: string } } | undefined)?.data;
      return taskRel?.id === taskId;
    });

    if (timeEntries.length === 0) {
      suggestions.push('ℹ️ No time entries on this task');
    }
  }

  return suggestions;
}

/**
 * Get suggestions for time.list response.
 *
 * - Shows total hours logged across all entries in the response.
 * - If filtered by today, shows hours vs 8h target.
 */
export function getTimeListSuggestions(
  entries: JsonApiResource[],
  filter?: Record<string, string>,
): string[] {
  const suggestions: string[] = [];
  if (!entries || entries.length === 0) return suggestions;

  // Sum all durations (stored in minutes)
  const totalMinutes = entries.reduce((sum, entry) => {
    const attrs = entry.attributes as Record<string, unknown>;
    return sum + ((attrs.time as number) || 0);
  }, 0);

  const totalHours = +(totalMinutes / 60).toFixed(1);

  // Detect if this is a "today" filter: after === today AND before === today
  const today = getToday();
  const isToday = filter?.after === today && filter?.before === today;

  if (isToday) {
    const targetHours = 8;
    suggestions.push(`📊 ${totalHours}h/${targetHours}h logged today`);
  } else if (totalMinutes > 0) {
    suggestions.push(`📊 Total: ${totalHours}h logged`);
  }

  return suggestions;
}

/**
 * Get suggestions for summaries.my_day response.
 *
 * - Warns if no time has been logged today.
 * - Warns if a timer has been running for more than 2 hours.
 */
export function getMyDaySuggestions(data: MyDaySummaryResult): string[] {
  const suggestions: string[] = [];
  if (!data) return suggestions;

  // No time logged today
  if (data.time.logged_today_minutes === 0 && data.time.entries_today === 0) {
    suggestions.push('⚠️ No time logged today');
  }

  // Timer running long (> 2 hours = 120 minutes)
  if (data.timers && data.timers.length > 0) {
    for (const timer of data.timers) {
      if (timer.total_time > 120) {
        const hours = +(timer.total_time / 60).toFixed(1);
        suggestions.push(`⏱️ Timer running for ${hours}h — remember to stop it`);
      }
    }
  }

  return suggestions;
}
