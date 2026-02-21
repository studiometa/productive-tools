/**
 * Get project context executor.
 *
 * Fetches a project with all related data in parallel:
 * - The project itself
 * - Open tasks (limited to 5)
 * - Services
 * - Time entries from the last 7 days
 */

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetProjectContextOptions, ProjectContextResult } from './types.js';

/** Maximum number of related items to fetch per category */
const MAX_TASKS = 5;
const MAX_SERVICES = 20;
const MAX_TIME_ENTRIES = 20;

/**
 * Get date string for N days ago (YYYY-MM-DD format)
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export async function getProjectContext(
  options: GetProjectContextOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<ProjectContextResult>> {
  // Resolve human-friendly ID first
  const resolvedId = await ctx.resolver.resolveValue(options.id, 'project');

  const sevenDaysAgo = getDateDaysAgo(7);

  // Fetch all related data in parallel
  const [projectResponse, tasksResponse, servicesResponse, timeEntriesResponse] = await Promise.all(
    [
      ctx.api.getProject(resolvedId),
      ctx.api.getTasks({
        filter: { project_id: resolvedId, status: '1' }, // status 1 = open
        perPage: MAX_TASKS,
        include: ['assignee', 'workflow_status'],
        sort: '-updated_at',
      }),
      ctx.api.getServices({
        filter: { project_id: resolvedId },
        perPage: MAX_SERVICES,
      }),
      ctx.api.getTimeEntries({
        filter: { project_id: resolvedId, after: sevenDaysAgo },
        perPage: MAX_TIME_ENTRIES,
        sort: '-date',
      }),
    ],
  );

  return {
    data: {
      project: projectResponse.data,
      tasks: tasksResponse.data,
      services: servicesResponse.data,
      time_entries: timeEntriesResponse.data,
    },
    included: [...(tasksResponse.included ?? [])],
  };
}
