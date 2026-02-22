import type { JsonApiResource } from '@studiometa/productive-api';
import type { MyDaySummaryResult } from '@studiometa/productive-core';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  getTaskListSuggestions,
  getTaskGetSuggestions,
  getTimeListSuggestions,
  getMyDaySuggestions,
} from './suggestions.js';

// ------------------------------------------------------------------
// Edge-case null/undefined guard tests
// ------------------------------------------------------------------

describe('null guard edge cases', () => {
  it('getTaskGetSuggestions returns empty for null task', () => {
    expect(getTaskGetSuggestions(null as unknown as JsonApiResource)).toEqual([]);
  });

  it('getTaskGetSuggestions returns empty when included is undefined', () => {
    const task = {
      id: '1',
      type: 'tasks',
      attributes: { title: 'Test', due_date: '2099-12-31', closed: false },
      relationships: {},
    } as unknown as JsonApiResource;
    // No included param — should not crash, no time entry suggestion
    const result = getTaskGetSuggestions(task, undefined);
    expect(result).toEqual([]);
  });

  it('getTaskGetSuggestions skips time entry check with empty included array', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    const task = {
      id: '1',
      type: 'tasks',
      attributes: { title: 'Test', due_date: '2099-12-31', closed: false },
      relationships: {},
    } as unknown as JsonApiResource;
    const result = getTaskGetSuggestions(task, []);
    // Should NOT contain time entry suggestion because included is empty
    expect(result).not.toContain('ℹ️ No time entries on this task');
    vi.useRealTimers();
  });

  it('getTaskGetSuggestions shows no time entries when included has non-matching entries', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    const task = {
      id: '1',
      type: 'tasks',
      attributes: { title: 'Test', due_date: '2099-12-31', closed: false },
      relationships: {},
    } as unknown as JsonApiResource;
    const included = [
      {
        id: 'te-1',
        type: 'time_entries',
        attributes: {},
        relationships: { task: { data: { id: '999' } } },
      },
    ] as unknown as JsonApiResource[];
    const result = getTaskGetSuggestions(task, included);
    expect(result).toContain('ℹ️ No time entries on this task');
    vi.useRealTimers();
  });

  it('getMyDaySuggestions returns empty for null data', () => {
    expect(getMyDaySuggestions(null as unknown as MyDaySummaryResult)).toEqual([]);
  });

  it('getTimeListSuggestions returns empty for null entries', () => {
    expect(getTimeListSuggestions(null as unknown as JsonApiResource[])).toEqual([]);
  });

  it('getTaskListSuggestions returns empty for null tasks', () => {
    expect(getTaskListSuggestions(null as unknown as JsonApiResource[])).toEqual([]);
  });
});

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Build a minimal task JsonApiResource */
function makeTask(overrides: {
  id?: string;
  due_date?: string;
  closed?: boolean;
  closed_at?: string;
  hasAssignee?: boolean;
}): JsonApiResource {
  return {
    id: overrides.id ?? '1',
    type: 'tasks',
    attributes: {
      title: 'Test task',
      due_date: overrides.due_date,
      closed: overrides.closed ?? false,
      closed_at: overrides.closed_at,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    relationships: {
      assignee:
        overrides.hasAssignee === false
          ? { data: null }
          : overrides.hasAssignee !== undefined
            ? { data: { id: '99', type: 'people' } }
            : undefined,
    },
  };
}

/** Build a minimal time entry JsonApiResource */
function makeTimeEntry(overrides: {
  id?: string;
  time?: number;
  date?: string;
  taskId?: string;
}): JsonApiResource {
  return {
    id: overrides.id ?? 't1',
    type: 'time_entries',
    attributes: {
      time: overrides.time ?? 60,
      date: overrides.date ?? '2024-01-15',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    relationships: overrides.taskId
      ? { task: { data: { id: overrides.taskId, type: 'tasks' } } }
      : undefined,
  };
}

// ------------------------------------------------------------------
// getTaskListSuggestions
// ------------------------------------------------------------------

describe('getTaskListSuggestions', () => {
  // Pin "today" so tests are deterministic
  const TODAY = '2024-06-15';
  const YESTERDAY = '2024-06-14';
  const TOMORROW = '2024-06-16';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array for empty task list', () => {
    expect(getTaskListSuggestions([])).toEqual([]);
  });

  it('returns empty array when no tasks are overdue or unassigned', () => {
    const tasks = [
      makeTask({ due_date: TOMORROW, hasAssignee: true }),
      makeTask({ id: '2', due_date: TOMORROW, hasAssignee: true }),
    ];
    expect(getTaskListSuggestions(tasks)).toEqual([]);
  });

  it('warns about overdue tasks', () => {
    const tasks = [
      makeTask({ due_date: YESTERDAY, hasAssignee: true }),
      makeTask({ id: '2', due_date: TOMORROW, hasAssignee: true }),
    ];
    const suggestions = getTaskListSuggestions(tasks);
    expect(suggestions).toContain('⚠️ 1 task(s) are overdue');
  });

  it('counts multiple overdue tasks', () => {
    const tasks = [
      makeTask({ id: '1', due_date: YESTERDAY, hasAssignee: true }),
      makeTask({ id: '2', due_date: '2024-01-01', hasAssignee: true }),
      makeTask({ id: '3', due_date: TOMORROW, hasAssignee: true }),
    ];
    const suggestions = getTaskListSuggestions(tasks);
    expect(suggestions).toContain('⚠️ 2 task(s) are overdue');
  });

  it('does not warn about closed tasks as overdue', () => {
    const tasks = [makeTask({ due_date: YESTERDAY, closed: true, hasAssignee: true })];
    expect(getTaskListSuggestions(tasks)).toEqual([]);
  });

  it('does not warn about tasks with closed_at as overdue', () => {
    const tasks = [
      makeTask({ due_date: YESTERDAY, closed_at: '2024-06-13T10:00:00Z', hasAssignee: true }),
    ];
    expect(getTaskListSuggestions(tasks)).toEqual([]);
  });

  it('warns about unassigned tasks', () => {
    const tasks = [makeTask({ hasAssignee: false })];
    const suggestions = getTaskListSuggestions(tasks);
    expect(suggestions).toContain('ℹ️ 1 task(s) have no assignee');
  });

  it('counts multiple unassigned tasks', () => {
    const tasks = [
      makeTask({ id: '1', hasAssignee: false }),
      makeTask({ id: '2', hasAssignee: false }),
      makeTask({ id: '3', hasAssignee: true }),
    ];
    const suggestions = getTaskListSuggestions(tasks);
    expect(suggestions).toContain('ℹ️ 2 task(s) have no assignee');
  });

  it('counts tasks with missing assignee relationship as unassigned', () => {
    // makeTask with no hasAssignee set leaves `relationships.assignee` undefined
    const task: JsonApiResource = {
      id: '1',
      type: 'tasks',
      attributes: { title: 'Task', created_at: '', updated_at: '' },
      // no relationships at all
    };
    const suggestions = getTaskListSuggestions([task]);
    expect(suggestions).toContain('ℹ️ 1 task(s) have no assignee');
  });

  it('can produce both overdue and unassigned suggestions', () => {
    const tasks = [makeTask({ id: '1', due_date: YESTERDAY, hasAssignee: false })];
    const suggestions = getTaskListSuggestions(tasks);
    expect(suggestions).toContain('⚠️ 1 task(s) are overdue');
    expect(suggestions).toContain('ℹ️ 1 task(s) have no assignee');
    expect(suggestions).toHaveLength(2);
  });
});

// ------------------------------------------------------------------
// getTaskGetSuggestions
// ------------------------------------------------------------------

describe('getTaskGetSuggestions', () => {
  const TODAY = '2024-06-15';
  const YESTERDAY = '2024-06-14';
  const TOMORROW = '2024-06-16';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array for a task with no issues', () => {
    const task = makeTask({ due_date: TOMORROW, hasAssignee: true });
    expect(getTaskGetSuggestions(task)).toEqual([]);
  });

  it('warns that a task is overdue', () => {
    const task = makeTask({ due_date: YESTERDAY });
    const suggestions = getTaskGetSuggestions(task);
    expect(suggestions[0]).toMatch(/⚠️ Task is \d+ day\(s\) overdue/);
  });

  it('shows correct number of overdue days', () => {
    // 5 days overdue
    vi.setSystemTime(new Date('2024-06-20T12:00:00Z'));
    const task = makeTask({ due_date: '2024-06-15' });
    const suggestions = getTaskGetSuggestions(task);
    expect(suggestions).toContain('⚠️ Task is 5 day(s) overdue');
  });

  it('does not warn about closed overdue tasks', () => {
    const task = makeTask({ due_date: YESTERDAY, closed: true });
    expect(getTaskGetSuggestions(task)).toEqual([]);
  });

  it('informs about no time entries when time_entries are included and empty', () => {
    const task = makeTask({ id: '42' });
    // Include some other task's time entry — not belonging to task 42
    const otherEntry = makeTimeEntry({ taskId: '99' });
    const suggestions = getTaskGetSuggestions(task, [otherEntry]);
    expect(suggestions).toContain('ℹ️ No time entries on this task');
  });

  it('does not warn about no time entries when a matching entry exists', () => {
    const task = makeTask({ id: '42' });
    const entry = makeTimeEntry({ taskId: '42' });
    const suggestions = getTaskGetSuggestions(task, [entry]);
    expect(suggestions).not.toContain('ℹ️ No time entries on this task');
  });

  it('does not check time entries when included is absent', () => {
    const task = makeTask({ id: '42' });
    // No included param — should not generate the no-time-entries suggestion
    const suggestions = getTaskGetSuggestions(task);
    expect(suggestions).not.toContain('ℹ️ No time entries on this task');
  });

  it('does not check time entries when included is empty array', () => {
    const task = makeTask({ id: '42' });
    const suggestions = getTaskGetSuggestions(task, []);
    expect(suggestions).not.toContain('ℹ️ No time entries on this task');
  });

  it('can produce both overdue and no-time-entries suggestions', () => {
    const task = makeTask({ id: '42', due_date: YESTERDAY });
    const otherEntry = makeTimeEntry({ taskId: '99' });
    const suggestions = getTaskGetSuggestions(task, [otherEntry]);
    expect(suggestions.some((s) => s.includes('overdue'))).toBe(true);
    expect(suggestions).toContain('ℹ️ No time entries on this task');
  });
});

// ------------------------------------------------------------------
// getTimeListSuggestions
// ------------------------------------------------------------------

describe('getTimeListSuggestions', () => {
  const TODAY = '2024-06-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array for empty entries', () => {
    expect(getTimeListSuggestions([])).toEqual([]);
  });

  it('returns total hours logged across all entries', () => {
    const entries = [
      makeTimeEntry({ time: 120 }), // 2h
      makeTimeEntry({ id: 't2', time: 90 }), // 1.5h
    ];
    const suggestions = getTimeListSuggestions(entries);
    expect(suggestions).toContain('📊 Total: 3.5h logged');
  });

  it('shows X/8h format when filtered by today', () => {
    const entries = [
      makeTimeEntry({ time: 240 }), // 4h
    ];
    const filter = { after: TODAY, before: TODAY };
    const suggestions = getTimeListSuggestions(entries, filter);
    expect(suggestions).toContain('📊 4h/8h logged today');
  });

  it('shows total (not X/8h) when filter is not today', () => {
    const entries = [
      makeTimeEntry({ time: 480 }), // 8h
    ];
    const filter = { after: '2024-01-01', before: '2024-01-07' };
    const suggestions = getTimeListSuggestions(entries, filter);
    expect(suggestions).toContain('📊 Total: 8h logged');
    expect(suggestions[0]).not.toContain('/8h logged today');
  });

  it('shows total when no filter is provided', () => {
    const entries = [makeTimeEntry({ time: 60 })];
    const suggestions = getTimeListSuggestions(entries);
    expect(suggestions).toContain('📊 Total: 1h logged');
  });

  it('rounds to 1 decimal place', () => {
    const entries = [
      makeTimeEntry({ time: 75 }), // 1.25h → 1.3h
    ];
    const suggestions = getTimeListSuggestions(entries);
    expect(suggestions).toContain('📊 Total: 1.3h logged');
  });

  it('returns empty for entries with zero time', () => {
    const entries = [makeTimeEntry({ time: 0 })];
    // totalMinutes = 0, so no suggestion generated
    expect(getTimeListSuggestions(entries)).toEqual([]);
  });
});

// ------------------------------------------------------------------
// getMyDaySuggestions
// ------------------------------------------------------------------

describe('getMyDaySuggestions', () => {
  function makeMyDayResult(overrides: Partial<MyDaySummaryResult> = {}): MyDaySummaryResult {
    return {
      summary_type: 'my_day',
      generated_at: new Date().toISOString(),
      user_id: '123',
      tasks: { open: 0, overdue: 0, items: [] },
      time: { logged_today_minutes: 0, entries_today: 0, items: [] },
      timers: [],
      ...overrides,
    };
  }

  it('returns empty array when all is fine', () => {
    const data = makeMyDayResult({
      time: { logged_today_minutes: 480, entries_today: 3, items: [] },
      timers: [],
    });
    expect(getMyDaySuggestions(data)).toEqual([]);
  });

  it('warns when no time has been logged today', () => {
    const data = makeMyDayResult({
      time: { logged_today_minutes: 0, entries_today: 0, items: [] },
    });
    const suggestions = getMyDaySuggestions(data);
    expect(suggestions).toContain('⚠️ No time logged today');
  });

  it('does not warn about no time when some minutes are logged', () => {
    const data = makeMyDayResult({
      time: { logged_today_minutes: 30, entries_today: 1, items: [] },
    });
    const suggestions = getMyDaySuggestions(data);
    expect(suggestions).not.toContain('⚠️ No time logged today');
  });

  it('warns when a timer has been running for more than 2 hours', () => {
    const data = makeMyDayResult({
      time: { logged_today_minutes: 60, entries_today: 1, items: [] },
      timers: [
        { id: 'tm1', started_at: new Date().toISOString(), total_time: 180 }, // 3h
      ],
    });
    const suggestions = getMyDaySuggestions(data);
    expect(suggestions).toContain('⏱️ Timer running for 3h — remember to stop it');
  });

  it('does not warn when timer is running for less than 2 hours', () => {
    const data = makeMyDayResult({
      time: { logged_today_minutes: 60, entries_today: 1, items: [] },
      timers: [
        { id: 'tm1', started_at: new Date().toISOString(), total_time: 90 }, // 1.5h — under limit
      ],
    });
    const suggestions = getMyDaySuggestions(data);
    expect(suggestions.some((s) => s.includes('⏱️'))).toBe(false);
  });

  it('warns for each long-running timer individually', () => {
    const data = makeMyDayResult({
      time: { logged_today_minutes: 60, entries_today: 1, items: [] },
      timers: [
        { id: 'tm1', started_at: new Date().toISOString(), total_time: 150 }, // 2.5h
        { id: 'tm2', started_at: new Date().toISOString(), total_time: 240 }, // 4h
      ],
    });
    const suggestions = getMyDaySuggestions(data);
    expect(suggestions.filter((s) => s.includes('⏱️'))).toHaveLength(2);
  });

  it('can produce both no-time and long-timer suggestions', () => {
    const data = makeMyDayResult({
      time: { logged_today_minutes: 0, entries_today: 0, items: [] },
      timers: [
        { id: 'tm1', started_at: new Date().toISOString(), total_time: 300 }, // 5h
      ],
    });
    const suggestions = getMyDaySuggestions(data);
    expect(suggestions).toContain('⚠️ No time logged today');
    expect(suggestions.some((s) => s.includes('⏱️'))).toBe(true);
  });
});
