/**
 * My Day summary executor.
 *
 * Provides a personal dashboard summary including:
 * - Open tasks assigned to the user
 * - Overdue tasks
 * - Time entries logged today
 * - Active timers
 */

import type { IncludedResource } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { MyDaySummaryOptions, MyDaySummaryResult } from './types.js';

import { ExecutorValidationError } from '../errors.js';
import { toSummaryTask, toSummaryTimeEntry, toSummaryTimer } from './types.js';

const MAX_ITEMS = 20;

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get tomorrow's date in YYYY-MM-DD format (for overdue filter)
 */
function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Fetch my_day summary.
 *
 * Parallel fetches:
 * - listTasks(assignee=me, status=open)
 * - listTimeEntries(person=me, date=today)
 * - listTimers(person=me)
 * - listTasks(assignee=me, overdue)
 */
export async function getMyDaySummary(
  _options: MyDaySummaryOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<MyDaySummaryResult>> {
  const userId = ctx.config.userId;
  if (!userId) {
    throw new ExecutorValidationError(
      'userId is required in ExecutorContext.config for my_day summary',
      'userId',
    );
  }

  const today = getToday();
  const tomorrow = getTomorrow();

  // Parallel fetch all data
  const [openTasksRes, overdueTasksRes, timeEntriesRes, timersRes] = await Promise.all([
    // Open tasks assigned to user
    ctx.api.getTasks({
      page: 1,
      perPage: MAX_ITEMS,
      filter: {
        assignee_id: userId,
        status: '1', // open
      },
      include: ['project', 'workflow_status'],
      sort: 'due_date',
    }),
    // Overdue tasks assigned to user
    ctx.api.getTasks({
      page: 1,
      perPage: MAX_ITEMS,
      filter: {
        assignee_id: userId,
        status: '1', // open
        due_date_before: tomorrow,
      },
      include: ['project', 'workflow_status'],
      sort: 'due_date',
    }),
    // Time entries logged today
    ctx.api.getTimeEntries({
      page: 1,
      perPage: MAX_ITEMS,
      filter: {
        person_id: userId,
        after: today,
        before: today,
      },
    }),
    // Active timers
    ctx.api.getTimers({
      page: 1,
      perPage: 10,
      filter: {
        person_id: userId,
      },
      include: ['time_entry'],
    }),
  ]);

  // Combine included resources
  const allIncluded: IncludedResource[] = [
    ...(openTasksRes.included || []),
    ...(overdueTasksRes.included || []),
    ...(timeEntriesRes.included || []),
    ...(timersRes.included || []),
  ];

  // Calculate totals
  const totalTimeToday = timeEntriesRes.data.reduce((sum, entry) => sum + entry.attributes.time, 0);

  // Filter overdue tasks to only include those with due_date before today
  // (API returns tasks with due_date < tomorrow, so we need to filter for < today)
  const overdueTaskIds = new Set(
    overdueTasksRes.data
      .filter((task) => task.attributes.due_date && task.attributes.due_date < today)
      .map((t) => t.id),
  );

  const result: MyDaySummaryResult = {
    summary_type: 'my_day',
    generated_at: new Date().toISOString(),
    user_id: userId,
    tasks: {
      open: openTasksRes.meta?.total_count ?? openTasksRes.data.length,
      overdue: overdueTaskIds.size,
      items: openTasksRes.data.slice(0, MAX_ITEMS).map((t) => toSummaryTask(t, allIncluded)),
    },
    time: {
      logged_today_minutes: totalTimeToday,
      entries_today: timeEntriesRes.meta?.total_count ?? timeEntriesRes.data.length,
      items: timeEntriesRes.data.slice(0, MAX_ITEMS).map((e) => toSummaryTimeEntry(e, allIncluded)),
    },
    timers: timersRes.data.map((t) => toSummaryTimer(t, allIncluded)),
  };

  return { data: result };
}
