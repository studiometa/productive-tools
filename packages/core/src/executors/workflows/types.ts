/**
 * Option and result types for workflow executors.
 */

import type { ProductiveTimeEntry } from '@studiometa/productive-api';

// ---------------------------------------------------------------------------
// complete_task
// ---------------------------------------------------------------------------

export interface CompleteTaskOptions {
  /** Task ID to mark as complete */
  taskId: string;
  /** Optional comment to post on the task */
  comment?: string;
  /** Whether to stop running timers on the task's service (default: true) */
  stopTimer?: boolean;
}

export interface CompleteTaskResult {
  workflow: 'complete_task';
  task: {
    id: string;
    title: string;
    closed: boolean;
  };
  comment_posted: boolean;
  comment_id?: string;
  timers_stopped: number;
  errors: string[];
}

// ---------------------------------------------------------------------------
// log_day
// ---------------------------------------------------------------------------

export interface LogDayEntry {
  /** Project ID for context (used for service resolution) */
  project_id: string;
  /** Service ID to log time against */
  service_id: string;
  /** Duration in minutes */
  duration_minutes: number;
  /** Optional note describing the work */
  note?: string;
  /** Override date for this specific entry (YYYY-MM-DD) */
  date?: string;
}

export interface LogDayOptions {
  /** Array of time entry definitions */
  entries: LogDayEntry[];
  /** Default date for all entries (YYYY-MM-DD, defaults to today) */
  date?: string;
  /** Person to log for (defaults to current user) */
  personId?: string;
}

export interface LogDayEntryResult {
  index: number;
  service_id: string;
  project_id: string;
  duration_minutes: number;
  note?: string;
  date: string;
  success: boolean;
  time_entry?: ProductiveTimeEntry;
  error?: string;
}

export interface LogDayResult {
  workflow: 'log_day';
  date: string;
  person_id: string;
  entries: LogDayEntryResult[];
  total_entries: number;
  succeeded: number;
  failed: number;
  total_minutes_logged: number;
}

// ---------------------------------------------------------------------------
// weekly_standup
// ---------------------------------------------------------------------------

export interface WeeklyStandupOptions {
  /** Person to generate standup for (defaults to current user) */
  personId?: string;
  /** ISO date for the Monday of the week (defaults to this Monday) */
  weekStart?: string;
}

export interface StandupTask {
  id: string;
  title: string;
  project_name?: string;
  closed_at?: string;
}

export interface StandupTimeByProject {
  project_id: string;
  project_name: string;
  total_minutes: number;
  entry_count: number;
}

export interface StandupUpcomingTask {
  id: string;
  title: string;
  project_name?: string;
  due_date: string;
  days_until_due: number;
}

export interface WeeklyStandupResult {
  workflow: 'weekly_standup';
  generated_at: string;
  person_id: string;
  week: {
    start: string;
    end: string;
  };
  completed_tasks: {
    count: number;
    items: StandupTask[];
  };
  time_logged: {
    total_minutes: number;
    by_project: StandupTimeByProject[];
  };
  upcoming_deadlines: {
    count: number;
    items: StandupUpcomingTask[];
  };
}
