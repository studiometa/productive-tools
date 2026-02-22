import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../errors.js';
import { weeklyStandup } from './weekly-standup.js';

describe('weeklyStandup', () => {
  const mockClosedTasksResponse = {
    data: [
      {
        id: 'task-1',
        type: 'tasks',
        attributes: {
          title: 'Fix login bug',
          closed: true,
          due_date: '2026-02-20',
          closed_at: '2026-02-20T10:00:00Z',
        },
        relationships: {
          project: { data: { type: 'projects', id: 'proj-1' } },
        },
      },
      {
        id: 'task-2',
        type: 'tasks',
        attributes: {
          title: 'Update docs',
          closed: true,
          due_date: '2026-02-21',
          closed_at: '2026-02-21T15:00:00Z',
        },
        relationships: {
          project: { data: { type: 'projects', id: 'proj-2' } },
        },
      },
    ],
    meta: { total_count: 2 },
    included: [
      { id: 'proj-1', type: 'projects', attributes: { name: 'Project Alpha' } },
      { id: 'proj-2', type: 'projects', attributes: { name: 'Project Beta' } },
    ],
  };

  const mockTimeEntriesResponse = {
    data: [
      {
        id: 'te-1',
        type: 'time_entries',
        attributes: { time: 120 },
        relationships: {
          project: { data: { type: 'projects', id: 'proj-1' } },
        },
      },
      {
        id: 'te-2',
        type: 'time_entries',
        attributes: { time: 60 },
        relationships: {
          project: { data: { type: 'projects', id: 'proj-1' } },
        },
      },
      {
        id: 'te-3',
        type: 'time_entries',
        attributes: { time: 90 },
        relationships: {
          project: { data: { type: 'projects', id: 'proj-2' } },
        },
      },
    ],
    meta: { total_count: 3 },
    included: [],
  };

  const mockUpcomingTasksResponse = {
    data: [
      {
        id: 'task-3',
        type: 'tasks',
        attributes: {
          title: 'Deploy to production',
          closed: false,
          due_date: '2026-02-25',
        },
        relationships: {
          project: { data: { type: 'projects', id: 'proj-1' } },
        },
      },
    ],
    meta: { total_count: 1 },
    included: [{ id: 'proj-1', type: 'projects', attributes: { name: 'Project Alpha' } }],
  };

  it('throws ExecutorValidationError when no userId and no personId', async () => {
    const ctx = createTestExecutorContext({
      config: { userId: undefined, organizationId: 'org-1' },
    });
    await expect(weeklyStandup({}, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(weeklyStandup({}, ctx)).rejects.toThrow('personId is required');
  });

  it('fetches and aggregates standup data', async () => {
    const getTasks = vi
      .fn()
      .mockResolvedValueOnce(mockClosedTasksResponse) // closed tasks this week
      .mockResolvedValueOnce(mockUpcomingTasksResponse); // upcoming tasks
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);

    expect(result.data.workflow).toBe('weekly_standup');
    expect(result.data.person_id).toBe('user-1');
    expect(result.data.generated_at).toBeDefined();
    expect(result.data.week.start).toBeDefined();
    expect(result.data.week.end).toBeDefined();
  });

  it('aggregates completed tasks correctly', async () => {
    const getTasks = vi
      .fn()
      .mockResolvedValueOnce(mockClosedTasksResponse)
      .mockResolvedValueOnce({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);

    expect(result.data.completed_tasks.count).toBe(2);
    expect(result.data.completed_tasks.items[0].id).toBe('task-1');
    expect(result.data.completed_tasks.items[0].title).toBe('Fix login bug');
    expect(result.data.completed_tasks.items[0].project_name).toBe('Project Alpha');
    expect(result.data.completed_tasks.items[0].closed_at).toBe('2026-02-20T10:00:00Z');
  });

  it('aggregates time entries by project', async () => {
    const getTasks = vi
      .fn()
      .mockResolvedValueOnce(mockClosedTasksResponse)
      .mockResolvedValueOnce({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);

    const { by_project, total_minutes } = result.data.time_logged;
    expect(total_minutes).toBe(270); // 120 + 60 + 90

    // Sorted by total_minutes descending
    expect(by_project[0].project_id).toBe('proj-1');
    expect(by_project[0].total_minutes).toBe(180); // 120 + 60
    expect(by_project[0].entry_count).toBe(2);

    expect(by_project[1].project_id).toBe('proj-2');
    expect(by_project[1].total_minutes).toBe(90);
    expect(by_project[1].entry_count).toBe(1);
  });

  it('aggregates upcoming deadlines correctly', async () => {
    const getTasks = vi
      .fn()
      .mockResolvedValueOnce({ data: [], meta: {}, included: [] })
      .mockResolvedValueOnce(mockUpcomingTasksResponse);
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);

    expect(result.data.upcoming_deadlines.count).toBe(1);
    expect(result.data.upcoming_deadlines.items[0].id).toBe('task-3');
    expect(result.data.upcoming_deadlines.items[0].title).toBe('Deploy to production');
    expect(result.data.upcoming_deadlines.items[0].due_date).toBe('2026-02-25');
    expect(result.data.upcoming_deadlines.items[0].days_until_due).toBeTypeOf('number');
    expect(result.data.upcoming_deadlines.items[0].project_name).toBe('Project Alpha');
  });

  it('uses personId option when provided', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-default', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({ personId: 'user-specific' }, ctx);

    expect(result.data.person_id).toBe('user-specific');
    expect(getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ assignee_id: 'user-specific' }),
      }),
    );
  });

  it('uses weekStart option when provided', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({ weekStart: '2026-02-16' }, ctx);

    expect(result.data.week.start).toBe('2026-02-16');
    expect(result.data.week.end).toBe('2026-02-22');
  });

  it('passes correct filters to API calls', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    await weeklyStandup({ weekStart: '2026-02-16' }, ctx);

    // First call: closed tasks this week
    expect(getTasks).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        filter: expect.objectContaining({
          assignee_id: 'user-1',
          status: '2',
          due_date_after: '2026-02-16',
        }),
        include: ['project'],
      }),
    );

    // Second call: upcoming tasks
    expect(getTasks).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        filter: expect.objectContaining({
          assignee_id: 'user-1',
          status: '1',
        }),
        include: ['project'],
      }),
    );

    // Time entries call
    expect(getTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          person_id: 'user-1',
          after: '2026-02-16',
          before: '2026-02-22',
        }),
      }),
    );
  });

  it('handles empty responses gracefully', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);

    expect(result.data.completed_tasks.count).toBe(0);
    expect(result.data.completed_tasks.items).toHaveLength(0);
    expect(result.data.time_logged.total_minutes).toBe(0);
    expect(result.data.time_logged.by_project).toHaveLength(0);
    expect(result.data.upcoming_deadlines.count).toBe(0);
    expect(result.data.upcoming_deadlines.items).toHaveLength(0);
  });

  it('uses custom weekStart when provided', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({ weekStart: '2026-01-06' }, ctx);

    expect(result.data.week.start).toBe('2026-01-06');
    expect(result.data.week.end).toBe('2026-01-12');
  });

  it('handles tasks with no project relationship', async () => {
    const taskNoProject = {
      data: [
        {
          id: 'task-noproj',
          type: 'tasks',
          attributes: {
            title: 'Orphan task',
            closed: true,
            due_date: '2026-02-20',
            closed_at: '2026-02-20T10:00:00Z',
          },
          relationships: {},
        },
      ],
      meta: {},
      included: [],
    };

    const getTasks = vi
      .fn()
      .mockResolvedValueOnce(taskNoProject)
      .mockResolvedValueOnce({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);
    expect(result.data.completed_tasks.items[0].project_name).toBeUndefined();
  });

  it('handles time entries with no project relationship', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'te-1',
          type: 'time_entries',
          attributes: { time: 120, date: '2026-02-22', note: 'Work' },
          relationships: {},
        },
      ],
      meta: {},
      included: [],
    });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);
    expect(result.data.time_logged.by_project[0].project_name).toBe('Unknown Project');
    expect(result.data.time_logged.by_project[0].project_id).toBe('unknown');
  });

  it('aggregates time entries with same project', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'te-1',
          type: 'time_entries',
          attributes: { time: 120, date: '2026-02-22', note: 'Morning' },
          relationships: { project: { data: { type: 'projects', id: 'proj-1' } } },
        },
        {
          id: 'te-2',
          type: 'time_entries',
          attributes: { time: 60, date: '2026-02-22', note: 'Afternoon' },
          relationships: { project: { data: { type: 'projects', id: 'proj-1' } } },
        },
      ],
      meta: {},
      included: [],
    });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);
    expect(result.data.time_logged.by_project).toHaveLength(1);
    expect(result.data.time_logged.by_project[0].total_minutes).toBe(180);
    expect(result.data.time_logged.by_project[0].entry_count).toBe(2);
  });

  it('handles responses with no included array', async () => {
    const getTasks = vi
      .fn()
      .mockResolvedValueOnce({ data: [], meta: {} })
      .mockResolvedValueOnce({ data: [], meta: {} });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);
    expect(result.data.completed_tasks.count).toBe(0);
  });

  it('filters out upcoming tasks without due_date', async () => {
    const noDueDateTask = {
      data: [
        {
          id: 'task-noduedate',
          type: 'tasks',
          attributes: { title: 'No due date task', closed: false, due_date: null },
          relationships: {},
        },
      ],
      meta: {},
      included: [],
    };

    const getTasks = vi
      .fn()
      .mockResolvedValueOnce({ data: [], meta: {}, included: [] })
      .mockResolvedValueOnce(noDueDateTask);
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await weeklyStandup({}, ctx);

    // Tasks without due_date should be filtered out of upcoming deadlines
    expect(result.data.upcoming_deadlines.count).toBe(0);
    expect(result.data.upcoming_deadlines.items).toHaveLength(0);
  });
});
