/**
 * Type-level tests for workflow types.
 *
 * These tests verify that the type exports compile correctly.
 * Runtime behavior is tested in the individual executor tests.
 */

import { describe, it, expect } from 'vitest';

import type {
  CompleteTaskOptions,
  CompleteTaskResult,
  LogDayEntry,
  LogDayOptions,
  LogDayResult,
  LogDayEntryResult,
  WeeklyStandupResult,
  StandupTask,
  StandupTimeByProject,
  StandupUpcomingTask,
} from './types.js';

describe('workflow types', () => {
  it('CompleteTaskOptions accepts required and optional fields', () => {
    const minimal: CompleteTaskOptions = { taskId: '1' };
    const full: CompleteTaskOptions = { taskId: '1', comment: 'done', stopTimer: true };
    expect(minimal.taskId).toBe('1');
    expect(full.comment).toBe('done');
  });

  it('CompleteTaskResult has expected shape', () => {
    const result: CompleteTaskResult = {
      workflow: 'complete_task',
      task: { id: '1', title: 'Task', closed: true },
      comment_posted: false,
      timers_stopped: 0,
      errors: [],
    };
    expect(result.workflow).toBe('complete_task');
    expect(result.task.closed).toBe(true);
  });

  it('LogDayEntry accepts required and optional fields', () => {
    const entry: LogDayEntry = {
      project_id: '100',
      service_id: '200',
      duration_minutes: 120,
    };
    const withOptionals: LogDayEntry = {
      project_id: '100',
      service_id: '200',
      duration_minutes: 120,
      note: 'Work done',
      date: '2026-02-22',
    };
    expect(entry.duration_minutes).toBe(120);
    expect(withOptionals.note).toBe('Work done');
  });

  it('LogDayOptions accepts entries array', () => {
    const opts: LogDayOptions = {
      entries: [{ project_id: '1', service_id: '2', duration_minutes: 60 }],
      date: '2026-02-22',
      personId: 'user-1',
    };
    expect(opts.entries).toHaveLength(1);
  });

  it('LogDayResult has workflow discriminator', () => {
    const result: LogDayResult = {
      workflow: 'log_day',
      date: '2026-02-22',
      person_id: 'user-1',
      entries: [],
      total_entries: 0,
      succeeded: 0,
      failed: 0,
      total_minutes_logged: 0,
    };
    expect(result.workflow).toBe('log_day');
  });

  it('LogDayEntryResult has success/failure variants', () => {
    const success: LogDayEntryResult = {
      index: 0,
      service_id: '111',
      project_id: '100',
      duration_minutes: 60,
      date: '2026-02-22',
      success: true,
    };
    const failure: LogDayEntryResult = {
      index: 1,
      service_id: '222',
      project_id: '200',
      duration_minutes: 30,
      date: '2026-02-22',
      success: false,
      error: 'API error',
    };
    expect(success.success).toBe(true);
    expect(failure.error).toBe('API error');
  });

  it('WeeklyStandupResult has all required fields', () => {
    const result: WeeklyStandupResult = {
      workflow: 'weekly_standup',
      generated_at: '2026-02-22T10:00:00Z',
      person_id: 'user-1',
      week: { start: '2026-02-17', end: '2026-02-23' },
      completed_tasks: { count: 0, items: [] },
      time_logged: { total_minutes: 0, by_project: [] },
      upcoming_deadlines: { count: 0, items: [] },
    };
    expect(result.workflow).toBe('weekly_standup');
  });

  it('StandupTask is serializable', () => {
    const task: StandupTask = {
      id: '1',
      title: 'Test task',
      project_name: 'My Project',
      closed_at: '2026-02-22T10:00:00Z',
    };
    expect(task.project_name).toBe('My Project');
  });

  it('StandupTimeByProject has all fields', () => {
    const summary: StandupTimeByProject = {
      project_id: '100',
      project_name: 'Project A',
      total_minutes: 480,
      entry_count: 4,
    };
    expect(summary.total_minutes).toBe(480);
  });

  it('StandupUpcomingTask includes days_until_due', () => {
    const upcoming: StandupUpcomingTask = {
      id: '1',
      title: 'Task due soon',
      due_date: '2026-02-25',
      days_until_due: 3,
    };
    expect(upcoming.days_until_due).toBe(3);
  });
});
