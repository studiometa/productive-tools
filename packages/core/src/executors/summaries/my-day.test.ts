import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../errors.js';
import { getMyDaySummary } from './my-day.js';

describe('getMyDaySummary', () => {
  const mockTasksResponse = {
    data: [
      {
        id: '1',
        type: 'tasks',
        attributes: { title: 'Task 1', due_date: '2026-02-25' },
        relationships: {
          project: { data: { type: 'projects', id: '100' } },
          workflow_status: { data: { type: 'workflow_statuses', id: '200' } },
        },
      },
      {
        id: '2',
        type: 'tasks',
        attributes: { title: 'Task 2', due_date: '2026-02-20' },
        relationships: {
          project: { data: { type: 'projects', id: '100' } },
        },
      },
    ],
    meta: { total_count: 5 },
    included: [
      { id: '100', type: 'projects', attributes: { name: 'Project A' } },
      { id: '200', type: 'workflow_statuses', attributes: { name: 'In Progress' } },
    ],
  };

  const mockOverdueResponse = {
    data: [
      {
        id: '2',
        type: 'tasks',
        attributes: { title: 'Task 2', due_date: '2026-02-15' },
      },
    ],
    meta: { total_count: 1 },
    included: [],
  };

  const mockTimeEntriesResponse = {
    data: [
      {
        id: '10',
        type: 'time_entries',
        attributes: { time: 60, note: 'Working on feature' },
        relationships: {
          service: { data: { type: 'services', id: '300' } },
          project: { data: { type: 'projects', id: '100' } },
        },
      },
      {
        id: '11',
        type: 'time_entries',
        attributes: { time: 30 },
        relationships: {},
      },
    ],
    meta: { total_count: 2 },
    included: [
      { id: '300', type: 'services', attributes: { name: 'Development' } },
      { id: '100', type: 'projects', attributes: { name: 'Project A' } },
    ],
  };

  const mockTimersResponse = {
    data: [
      {
        id: '20',
        type: 'timers',
        attributes: { started_at: '2026-02-21T09:00:00Z', total_time: 120, person_id: 1 },
        relationships: {},
      },
    ],
    meta: {},
    included: [],
  };

  it('fetches and aggregates data for my_day summary', async () => {
    const getTasks = vi
      .fn()
      .mockResolvedValueOnce(mockTasksResponse) // open tasks
      .mockResolvedValueOnce(mockOverdueResponse); // overdue tasks
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);
    const getTimers = vi.fn().mockResolvedValue(mockTimersResponse);

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries, getTimers },
      config: { userId: 'user-123', organizationId: 'org-456' },
    });

    const result = await getMyDaySummary({}, ctx);

    expect(result.data.summary_type).toBe('my_day');
    expect(result.data.user_id).toBe('user-123');
    expect(result.data.tasks.open).toBe(5); // from meta.total_count
    expect(result.data.tasks.items).toHaveLength(2);
    expect(result.data.tasks.items[0].project_name).toBe('Project A');
    expect(result.data.tasks.items[0].status).toBe('In Progress');
    expect(result.data.time.logged_today_minutes).toBe(90); // 60 + 30
    expect(result.data.time.entries_today).toBe(2);
    expect(result.data.timers).toHaveLength(1);
    expect(result.data.timers[0].total_time).toBe(120);
    expect(result.data.generated_at).toBeDefined();
  });

  it('throws ExecutorValidationError when userId is missing', async () => {
    // Need to provide mock API methods even though they won't be called
    // because the test framework validates function presence
    const getTasks = vi.fn();
    const getTimeEntries = vi.fn();
    const getTimers = vi.fn();

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries, getTimers },
      config: { userId: undefined, organizationId: 'org-456' }, // explicitly no userId
    });

    await expect(getMyDaySummary({}, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(getMyDaySummary({}, ctx)).rejects.toThrow('userId is required');
    // API methods should NOT be called because we throw early
    expect(getTasks).not.toHaveBeenCalled();
  });

  it('passes correct filters to API calls', async () => {
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries, getTimers },
      config: { userId: 'user-123', organizationId: 'org-456' },
    });

    await getMyDaySummary({}, ctx);

    // Check open tasks call
    expect(getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          assignee_id: 'user-123',
          status: '1',
        }),
        include: ['project', 'workflow_status'],
      }),
    );

    // Check overdue tasks call (second call)
    expect(getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          assignee_id: 'user-123',
          status: '1',
          due_date_before: expect.any(String),
        }),
      }),
    );

    // Check time entries call
    expect(getTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          person_id: 'user-123',
          after: expect.any(String),
          before: expect.any(String),
        }),
      }),
    );

    // Check timers call
    expect(getTimers).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          person_id: 'user-123',
        }),
        include: ['time_entry'],
      }),
    );
  });

  it('handles empty responses gracefully', async () => {
    const emptyResponse = { data: [], meta: { total_count: 0 }, included: [] };
    const getTasks = vi.fn().mockResolvedValue(emptyResponse);
    const getTimeEntries = vi.fn().mockResolvedValue(emptyResponse);
    const getTimers = vi.fn().mockResolvedValue(emptyResponse);

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries, getTimers },
      config: { userId: 'user-123', organizationId: 'org-456' },
    });

    const result = await getMyDaySummary({}, ctx);

    expect(result.data.tasks.open).toBe(0);
    expect(result.data.tasks.overdue).toBe(0);
    expect(result.data.tasks.items).toHaveLength(0);
    expect(result.data.time.logged_today_minutes).toBe(0);
    expect(result.data.time.entries_today).toBe(0);
    expect(result.data.timers).toHaveLength(0);
  });

  it('resolves project and service names from included resources', async () => {
    const getTasks = vi.fn().mockResolvedValue(mockTasksResponse);
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);
    const getTimers = vi.fn().mockResolvedValue(mockTimersResponse);

    const ctx = createTestExecutorContext({
      api: { getTasks, getTimeEntries, getTimers },
      config: { userId: 'user-123', organizationId: 'org-456' },
    });

    const result = await getMyDaySummary({}, ctx);

    // Check project name is resolved for tasks
    expect(result.data.tasks.items[0].project_name).toBe('Project A');

    // Check service and project names are resolved for time entries
    expect(result.data.time.items[0].service_name).toBe('Development');
    expect(result.data.time.items[0].project_name).toBe('Project A');
  });
});
