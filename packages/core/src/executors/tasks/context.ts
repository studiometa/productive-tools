/**
 * Get task context executor.
 *
 * Fetches a task with all related data in parallel:
 * - The task itself
 * - Comments on the task
 * - Time entries for the task
 * - Subtasks (child tasks)
 */

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { GetTaskContextOptions, TaskContextResult } from './types.js';

/** Maximum number of related items to fetch per category */
const MAX_RELATED_ITEMS = 20;

export async function getTaskContext(
  options: GetTaskContextOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<TaskContextResult>> {
  const { id } = options;

  // Fetch all related data in parallel
  const [taskResponse, commentsResponse, timeEntriesResponse, subtasksResponse] = await Promise.all(
    [
      ctx.api.getTask(id, {
        include: ['project', 'assignee', 'workflow_status', 'service', 'creator', 'parent_task'],
      }),
      ctx.api.getComments({
        filter: { task_id: id },
        perPage: MAX_RELATED_ITEMS,
        include: ['creator'],
      }),
      ctx.api.getTimeEntries({
        filter: { task_id: id },
        perPage: MAX_RELATED_ITEMS,
        sort: '-date',
      }),
      ctx.api.getTasks({
        filter: { parent_task_id: id, status: '1' }, // status 1 = open
        perPage: MAX_RELATED_ITEMS,
        include: ['assignee', 'workflow_status'],
      }),
    ],
  );

  return {
    data: {
      task: taskResponse.data,
      comments: commentsResponse.data,
      time_entries: timeEntriesResponse.data,
      subtasks: subtasksResponse.data,
    },
    included: [
      ...(taskResponse.included ?? []),
      ...(commentsResponse.included ?? []),
      ...(subtasksResponse.included ?? []),
    ],
  };
}
