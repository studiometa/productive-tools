import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../errors.js';
import { getProjectHealthSummary } from './project-health.js';

describe('getProjectHealthSummary', () => {
  const mockProjectResponse = {
    data: {
      id: '100',
      type: 'projects',
      attributes: {
        name: 'Project Alpha',
        project_number: 'PRJ-100',
      },
    },
  };

  const mockOpenTasksResponse = {
    data: [
      {
        id: '1',
        type: 'tasks',
        attributes: { title: 'Task 1', due_date: '2026-02-25' },
        relationships: {
          workflow_status: { data: { type: 'workflow_statuses', id: '200' } },
          assignee: { data: { type: 'people', id: '300' } },
        },
      },
      {
        id: '2',
        type: 'tasks',
        attributes: { title: 'Task 2', due_date: '2026-02-28' },
        relationships: {},
      },
    ],
    meta: { total_count: 10 },
    included: [
      { id: '200', type: 'workflow_statuses', attributes: { name: 'In Progress' } },
      { id: '300', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } },
    ],
  };

  const mockOverdueTasksResponse = {
    data: [
      {
        id: '3',
        type: 'tasks',
        attributes: { title: 'Overdue Task', due_date: '2026-02-10' },
      },
    ],
    meta: { total_count: 2 },
    included: [],
  };

  const mockServicesResponse = {
    data: [
      {
        id: '400',
        type: 'services',
        attributes: { name: 'Development', budgeted_time: 6000, worked_time: 3000 },
      },
      {
        id: '401',
        type: 'services',
        attributes: { name: 'Design', budgeted_time: 2000, worked_time: 1500 },
      },
    ],
    meta: {},
  };

  const mockTimeEntriesResponse = {
    data: [
      { id: '500', type: 'time_entries', attributes: { time: 120 } },
      { id: '501', type: 'time_entries', attributes: { time: 60 } },
      { id: '502', type: 'time_entries', attributes: { time: 90 } },
    ],
    meta: { total_count: 15 },
  };

  it('fetches and aggregates data for project_health summary', async () => {
    const getProject = vi.fn().mockResolvedValue(mockProjectResponse);
    const getTasks = vi
      .fn()
      .mockResolvedValueOnce(mockOpenTasksResponse)
      .mockResolvedValueOnce(mockOverdueTasksResponse);
    const getServices = vi.fn().mockResolvedValue(mockServicesResponse);
    const getTimeEntries = vi.fn().mockResolvedValue(mockTimeEntriesResponse);

    const ctx = createTestExecutorContext({
      api: { getProject, getTasks, getServices, getTimeEntries },
    });

    const result = await getProjectHealthSummary({ projectId: '100' }, ctx);

    expect(result.data.summary_type).toBe('project_health');
    expect(result.data.project.id).toBe('100');
    expect(result.data.project.name).toBe('Project Alpha');
    expect(result.data.project.project_number).toBe('PRJ-100');
    expect(result.data.tasks.open).toBe(10);
    expect(result.data.tasks.overdue).toBe(2);
    expect(result.data.tasks.items).toHaveLength(2);
    expect(result.data.budget.services).toHaveLength(2);
    expect(result.data.budget.total_budgeted_minutes).toBe(8000); // 6000 + 2000
    expect(result.data.budget.total_worked_minutes).toBe(4500); // 3000 + 1500
    expect(result.data.budget.burn_rate_percent).toBe(56); // 4500 / 8000 * 100 ≈ 56
    expect(result.data.recent_activity.time_entries_last_7_days).toBe(15);
    expect(result.data.recent_activity.total_time_last_7_days_minutes).toBe(270); // 120 + 60 + 90
  });

  it('throws ExecutorValidationError when projectId is missing', async () => {
    const ctx = createTestExecutorContext({});

    await expect(getProjectHealthSummary({ projectId: '' }, ctx)).rejects.toThrow(
      ExecutorValidationError,
    );
    await expect(getProjectHealthSummary({ projectId: '' }, ctx)).rejects.toThrow(
      'projectId is required',
    );
  });

  it('resolves project ID through resolver', async () => {
    const getProject = vi.fn().mockResolvedValue(mockProjectResponse);
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getServices = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const resolveValue = vi.fn().mockResolvedValue('100');

    const ctx = createTestExecutorContext({
      api: { getProject, getTasks, getServices, getTimeEntries },
      resolver: { resolveValue },
    });

    await getProjectHealthSummary({ projectId: 'PRJ-100' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('PRJ-100', 'project');
    expect(getProject).toHaveBeenCalledWith('100');
  });

  it('passes correct filters to API calls', async () => {
    const getProject = vi.fn().mockResolvedValue(mockProjectResponse);
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getServices = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({
      api: { getProject, getTasks, getServices, getTimeEntries },
    });

    await getProjectHealthSummary({ projectId: '100' }, ctx);

    // Check open tasks call
    expect(getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          project_id: '100',
          status: '1',
        }),
        include: ['workflow_status', 'assignee'],
      }),
    );

    // Check overdue tasks call (second call)
    expect(getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          project_id: '100',
          status: '1',
          overdue_status: '2',
        }),
      }),
    );

    // Check services call
    expect(getServices).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          project_id: '100',
        }),
        perPage: 100, // Get all services
      }),
    );

    // Check time entries call
    expect(getTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({
          project_id: '100',
          after: expect.any(String),
          before: expect.any(String),
        }),
      }),
    );
  });

  it('calculates budget services correctly', async () => {
    const getProject = vi.fn().mockResolvedValue(mockProjectResponse);
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getServices = vi.fn().mockResolvedValue(mockServicesResponse);
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({
      api: { getProject, getTasks, getServices, getTimeEntries },
    });

    const result = await getProjectHealthSummary({ projectId: '100' }, ctx);

    const devService = result.data.budget.services.find((s) => s.name === 'Development');
    expect(devService).toBeDefined();
    expect(devService?.budgeted_time).toBe(6000);
    expect(devService?.worked_time).toBe(3000);
    expect(devService?.remaining_time).toBe(3000);

    const designService = result.data.budget.services.find((s) => s.name === 'Design');
    expect(designService).toBeDefined();
    expect(designService?.budgeted_time).toBe(2000);
    expect(designService?.worked_time).toBe(1500);
    expect(designService?.remaining_time).toBe(500);
  });

  it('handles zero budget gracefully (no division by zero)', async () => {
    const getProject = vi.fn().mockResolvedValue(mockProjectResponse);
    const getTasks = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });
    const getServices = vi.fn().mockResolvedValue({
      data: [{ id: '400', type: 'services', attributes: { name: 'Service', worked_time: 100 } }],
      meta: {},
    });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({
      api: { getProject, getTasks, getServices, getTimeEntries },
    });

    const result = await getProjectHealthSummary({ projectId: '100' }, ctx);

    // With zero budgeted time, burn rate should be 0
    expect(result.data.budget.burn_rate_percent).toBe(0);
    expect(result.data.budget.total_budgeted_minutes).toBe(0);
    expect(result.data.budget.total_worked_minutes).toBe(100);
  });

  it('handles empty responses gracefully', async () => {
    const emptyResponse = { data: [], meta: { total_count: 0 }, included: [] };
    const getProject = vi.fn().mockResolvedValue(mockProjectResponse);
    const getTasks = vi.fn().mockResolvedValue(emptyResponse);
    const getServices = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const getTimeEntries = vi.fn().mockResolvedValue({ data: [], meta: { total_count: 0 } });

    const ctx = createTestExecutorContext({
      api: { getProject, getTasks, getServices, getTimeEntries },
    });

    const result = await getProjectHealthSummary({ projectId: '100' }, ctx);

    expect(result.data.tasks.open).toBe(0);
    expect(result.data.tasks.overdue).toBe(0);
    expect(result.data.budget.services).toHaveLength(0);
    expect(result.data.recent_activity.time_entries_last_7_days).toBe(0);
  });
});
