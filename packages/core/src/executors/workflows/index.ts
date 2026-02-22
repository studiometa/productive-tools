/**
 * Workflow executors.
 *
 * Compound workflows that chain multiple existing executors into single tool calls:
 * - complete_task: Mark task closed, optionally comment and stop timers
 * - log_day: Create multiple time entries in parallel from a structured list
 * - weekly_standup: Aggregate completed tasks, time logged, and upcoming deadlines
 */

export { completeTask } from './complete-task.js';
export { logDay } from './log-day.js';
export { weeklyStandup } from './weekly-standup.js';

export type {
  CompleteTaskOptions,
  CompleteTaskResult,
  LogDayEntry,
  LogDayEntryResult,
  LogDayOptions,
  LogDayResult,
  StandupTask,
  StandupTimeByProject,
  StandupUpcomingTask,
  WeeklyStandupOptions,
  WeeklyStandupResult,
} from './types.js';
