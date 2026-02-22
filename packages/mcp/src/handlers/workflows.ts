/**
 * Workflows MCP handler.
 *
 * Custom handler for compound workflows that chain multiple executors.
 * NOT using createResourceHandler — standalone routing like summaries.ts.
 *
 * Supported actions:
 * - complete_task: Mark task closed, optionally comment and stop timers
 * - log_day: Create multiple time entries in parallel from a structured list
 * - weekly_standup: Aggregate completed tasks, time logged, and upcoming deadlines
 */

import { completeTask, logDay, weeklyStandup } from '@studiometa/productive-core';

import type { HandlerContext, ToolResult } from './types.js';

import { ErrorMessages, UserInputError } from '../errors.js';
import { inputErrorResult, jsonResult } from './utils.js';

const VALID_ACTIONS = ['complete_task', 'log_day', 'weekly_standup', 'help'];

interface CompleteTaskArgs {
  task_id?: string;
  comment?: string;
  stop_timer?: boolean;
}

interface LogDayEntryArg {
  project_id: string;
  service_id: string;
  duration_minutes: number;
  note?: string;
  date?: string;
}

interface LogDayArgs {
  entries?: Array<Record<string, unknown>>;
  date?: string;
  person_id?: string;
}

interface WeeklyStandupArgs {
  person_id?: string;
  week_start?: string;
}

type WorkflowArgs = CompleteTaskArgs & LogDayArgs & WeeklyStandupArgs;

/**
 * Handle workflows resource.
 *
 * Supports: complete_task, log_day, weekly_standup
 */
export async function handleWorkflows(
  action: string,
  args: WorkflowArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  if (!VALID_ACTIONS.includes(action)) {
    return inputErrorResult(ErrorMessages.invalidAction(action, 'workflows', VALID_ACTIONS));
  }

  const execCtx = ctx.executor();

  switch (action) {
    case 'complete_task': {
      if (!args.task_id) {
        return inputErrorResult(
          new UserInputError('task_id is required for complete_task workflow', [
            'Provide the task_id parameter (numeric task ID)',
            'You can find task IDs using resource="tasks" action="list"',
          ]),
        );
      }

      const result = await completeTask(
        {
          taskId: args.task_id,
          comment: args.comment,
          stopTimer: args.stop_timer,
        },
        execCtx,
      );
      return jsonResult(result.data);
    }

    case 'log_day': {
      if (!args.entries || !Array.isArray(args.entries) || args.entries.length === 0) {
        return inputErrorResult(
          new UserInputError('entries is required and must be a non-empty array for log_day workflow', [
            'Provide entries as an array of { project_id, service_id, duration_minutes, note?, date? }',
            'Example: { "entries": [{ "project_id": "123", "service_id": "456", "duration_minutes": 120, "note": "Development" }] }',
            'You can find service IDs using resource="services" action="list" with filter.project_id',
          ]),
        );
      }

      const mappedEntries = (args.entries as Array<Record<string, unknown>>).map((e) => {
        const entry = e as unknown as LogDayEntryArg;
        return {
          project_id: String(entry.project_id),
          service_id: String(entry.service_id),
          duration_minutes: Number(entry.duration_minutes),
          note: entry.note != null ? String(entry.note) : undefined,
          date: entry.date != null ? String(entry.date) : undefined,
        };
      });

      const result = await logDay(
        {
          entries: mappedEntries,
          date: args.date,
          personId: args.person_id,
        },
        execCtx,
      );
      return jsonResult(result.data);
    }

    case 'weekly_standup': {
      const result = await weeklyStandup(
        {
          personId: args.person_id,
          weekStart: args.week_start,
        },
        execCtx,
      );
      return jsonResult(result.data);
    }

    case 'help': {
      return jsonResult({
        resource: 'workflows',
        description:
          'Compound workflows that chain multiple resource operations into a single tool call',
        actions: {
          complete_task: {
            description: 'Mark a task as complete, optionally post a comment and stop running timers',
            parameters: {
              task_id: 'Required. The task ID to complete',
              comment: 'Optional. A completion comment to post on the task',
              stop_timer: 'Optional. Whether to stop running timers (default: true)',
            },
            returns: {
              task: 'Updated task info (id, title, closed status)',
              comment_posted: 'Whether the comment was posted',
              comment_id: 'ID of the created comment (if posted)',
              timers_stopped: 'Number of timers stopped',
              errors: 'Any sub-step errors (partial results are still returned)',
            },
          },
          log_day: {
            description: 'Create multiple time entries in parallel from a structured list',
            parameters: {
              entries: 'Required. Array of { project_id, service_id, duration_minutes, note?, date? }',
              date: 'Optional. Default date for all entries (YYYY-MM-DD, defaults to today)',
              person_id: 'Optional. Person to log for (defaults to current user)',
            },
            returns: {
              entries: 'Per-entry results with success/failure status',
              succeeded: 'Number of entries successfully created',
              failed: 'Number of entries that failed',
              total_minutes_logged: 'Sum of minutes for successful entries',
            },
          },
          weekly_standup: {
            description:
              'Aggregate a weekly standup: completed tasks, time logged, and upcoming deadlines',
            parameters: {
              person_id: 'Optional. Person to generate standup for (defaults to current user)',
              week_start: 'Optional. ISO date for Monday of the week (defaults to this Monday)',
            },
            returns: {
              completed_tasks: 'Tasks closed this week (count + list)',
              time_logged: 'Total minutes and breakdown by project',
              upcoming_deadlines: 'Open tasks due in the next 7 days',
            },
          },
        },
      });
    }

    default: {
      return inputErrorResult(ErrorMessages.invalidAction(action, 'workflows', VALID_ACTIONS));
    }
  }
}
