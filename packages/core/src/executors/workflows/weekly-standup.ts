/**
 * Weekly Standup workflow executor.
 *
 * Aggregates data for a weekly standup report:
 * - Tasks completed this week
 * - Time logged this week grouped by project
 * - Upcoming deadlines in the next 7 days
 *
 * All fetches are done in parallel for performance.
 */

import type { IncludedResource } from '@studiometa/productive-api';

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type {
  WeeklyStandupOptions,
  WeeklyStandupResult,
  StandupTask,
  StandupTimeByProject,
  StandupUpcomingTask,
} from './types.js';

import { ExecutorValidationError } from '../errors.js';

const MAX_ITEMS = 50;

/**
 * Get this Monday's date in YYYY-MM-DD format.
 */
function getThisMonday(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sunday, 1=Monday, …
  const diff = day === 0 ? -6 : 1 - day; // How many days to go back to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

/**
 * Add N days to a YYYY-MM-DD string, returning YYYY-MM-DD.
 */
function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Difference in calendar days between two YYYY-MM-DD strings.
 * Positive = toDate is in the future.
 */
function daysDiff(from: string, to: string): number {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

/**
 * Resolve project name from included resources.
 */
function resolveProjectName(
  projectId: string | undefined,
  included: IncludedResource[],
): string | undefined {
  if (!projectId) return undefined;
  const project = included.find((r) => r.type === 'projects' && r.id === projectId);
  return project ? (project.attributes.name as string) : undefined;
}

/**
 * Generate a weekly standup summary.
 *
 * Parallel fetches:
 * 1. Closed tasks assigned to person this week
 * 2. Time entries for this week (to group by project)
 * 3. Open tasks with upcoming deadlines (next 7 days)
 */
export async function weeklyStandup(
  options: WeeklyStandupOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<WeeklyStandupResult>> {
  const userId = options.personId ?? ctx.config.userId;
  if (!userId) {
    throw new ExecutorValidationError(
      'personId is required for weekly_standup workflow (or set userId in ExecutorContext.config)',
      'personId',
    );
  }

  const weekStart = options.weekStart ?? getThisMonday();
  const weekEnd = addDays(weekStart, 6); // Sunday
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = addDays(today, 7);

  // Parallel fetch all data
  const [closedTasksRes, timeEntriesRes, upcomingTasksRes] = await Promise.all([
    // 1. Tasks closed this week (assigned to user)
    ctx.api.getTasks({
      page: 1,
      perPage: MAX_ITEMS,
      filter: {
        assignee_id: userId,
        status: '2', // closed
        due_date_after: weekStart,
        due_date_before: addDays(weekEnd, 1), // exclusive upper bound
      },
      include: ['project'],
      sort: '-closed_at',
    }),

    // 2. Time entries for this week
    ctx.api.getTimeEntries({
      page: 1,
      perPage: MAX_ITEMS,
      filter: {
        person_id: userId,
        after: weekStart,
        before: weekEnd,
      },
    }),

    // 3. Upcoming tasks with deadlines in the next 7 days (open tasks)
    ctx.api.getTasks({
      page: 1,
      perPage: MAX_ITEMS,
      filter: {
        assignee_id: userId,
        status: '1', // open
        due_date_after: today,
        due_date_before: addDays(nextWeek, 1), // exclusive upper bound
      },
      include: ['project'],
      sort: 'due_date',
    }),
  ]);

  // Combine included resources for name resolution
  const allIncluded: IncludedResource[] = [
    ...(closedTasksRes.included ?? []),
    ...(upcomingTasksRes.included ?? []),
  ];

  // Build completed tasks list
  const completedTasks: StandupTask[] = closedTasksRes.data.map((task) => {
    const projectRel = task.relationships?.project?.data;
    return {
      id: task.id,
      title: task.attributes.title,
      project_name: resolveProjectName(projectRel?.id, allIncluded),
      closed_at: task.attributes.closed_at,
    };
  });

  // Aggregate time entries by project
  const projectTimeMap = new Map<
    string,
    { project_id: string; project_name: string; total_minutes: number; entry_count: number }
  >();

  for (const entry of timeEntriesRes.data) {
    const projectRel = entry.relationships?.project?.data;
    const projectId = projectRel?.id ?? 'unknown';
    const projectName =
      resolveProjectName(projectId !== 'unknown' ? projectId : undefined, allIncluded) ??
      'Unknown Project';

    const existing = projectTimeMap.get(projectId);
    if (existing) {
      existing.total_minutes += entry.attributes.time;
      existing.entry_count += 1;
    } else {
      projectTimeMap.set(projectId, {
        project_id: projectId,
        project_name: projectName,
        total_minutes: entry.attributes.time,
        entry_count: 1,
      });
    }
  }

  const timeByProject: StandupTimeByProject[] = Array.from(projectTimeMap.values()).toSorted(
    (a, b) => b.total_minutes - a.total_minutes,
  );

  const totalMinutes = timeByProject.reduce((sum, p) => sum + p.total_minutes, 0);

  // Build upcoming deadlines list
  const upcomingDeadlines: StandupUpcomingTask[] = upcomingTasksRes.data
    .filter((task) => task.attributes.due_date)
    .map((task) => {
      const projectRel = task.relationships?.project?.data;
      const dueDate = task.attributes.due_date as string;
      return {
        id: task.id,
        title: task.attributes.title,
        project_name: resolveProjectName(projectRel?.id, allIncluded),
        due_date: dueDate,
        days_until_due: daysDiff(today, dueDate),
      };
    });

  const result: WeeklyStandupResult = {
    workflow: 'weekly_standup',
    generated_at: new Date().toISOString(),
    person_id: userId,
    week: {
      start: weekStart,
      end: weekEnd,
    },
    completed_tasks: {
      count: completedTasks.length,
      items: completedTasks,
    },
    time_logged: {
      total_minutes: totalMinutes,
      by_project: timeByProject,
    },
    upcoming_deadlines: {
      count: upcomingDeadlines.length,
      items: upcomingDeadlines,
    },
  };

  return { data: result };
}
