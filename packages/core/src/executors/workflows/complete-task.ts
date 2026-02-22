/**
 * Complete Task workflow executor.
 *
 * Chains multiple executors into a single call:
 * 1. Update task to closed (closed=true)
 * 2. Optionally post a completion comment
 * 3. Optionally stop any running timers for the current user
 *
 * Individual sub-steps may fail without aborting the whole workflow;
 * partial results are reported in the `errors` array.
 */

import type { ExecutorContext } from '../../context/types.js';
import type { ExecutorResult } from '../types.js';
import type { CompleteTaskOptions, CompleteTaskResult } from './types.js';

import { ExecutorValidationError } from '../errors.js';

/**
 * Complete a task: mark it closed, optionally comment and stop timers.
 */
export async function completeTask(
  options: CompleteTaskOptions,
  ctx: ExecutorContext,
): Promise<ExecutorResult<CompleteTaskResult>> {
  if (!options.taskId) {
    throw new ExecutorValidationError('taskId is required for complete_task workflow', 'taskId');
  }

  const errors: string[] = [];
  let commentPosted = false;
  let commentId: string | undefined;
  let timersStopped = 0;

  // Step 1: Fetch the task (to get title and validate it exists)
  let taskId = options.taskId;
  let taskTitle = '';
  let taskClosed = false;

  try {
    const taskResponse = await ctx.api.getTask(options.taskId);
    taskId = taskResponse.data.id;
    taskTitle = taskResponse.data.attributes.title;
    taskClosed = taskResponse.data.attributes.closed ?? false;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ExecutorValidationError(
      `Failed to fetch task ${options.taskId}: ${message}`,
      'taskId',
    );
  }

  // Step 2: Mark task as closed
  try {
    const updated = await ctx.api.updateTask(taskId, { closed: true });
    taskClosed = updated.data.attributes.closed ?? true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to mark task as closed: ${message}`);
  }

  // Step 3: Optionally post a comment
  if (options.comment) {
    try {
      const commentResponse = await ctx.api.createComment({
        body: options.comment,
        task_id: taskId,
      });
      commentPosted = true;
      commentId = commentResponse.data.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to post comment: ${message}`);
    }
  }

  // Step 4: Optionally stop running timers
  const shouldStopTimers = options.stopTimer !== false;
  if (shouldStopTimers) {
    try {
      const userId = ctx.config.userId;
      const timerFilter: Record<string, string> = {};
      if (userId) timerFilter.person_id = userId;

      const timersResponse = await ctx.api.getTimers({
        page: 1,
        perPage: 50,
        filter: timerFilter,
      });

      // Stop all active timers for the user
      const stopResults = await Promise.allSettled(
        timersResponse.data.map((timer) => ctx.api.stopTimer(timer.id)),
      );

      for (const result of stopResults) {
        if (result.status === 'fulfilled') {
          timersStopped++;
        } else {
          const message =
            result.reason instanceof Error ? result.reason.message : String(result.reason);
          errors.push(`Failed to stop timer: ${message}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to fetch/stop timers: ${message}`);
    }
  }

  const result: CompleteTaskResult = {
    workflow: 'complete_task',
    task: {
      id: taskId,
      title: taskTitle,
      closed: taskClosed,
    },
    comment_posted: commentPosted,
    comment_id: commentId,
    timers_stopped: timersStopped,
    errors,
  };

  return { data: result };
}
