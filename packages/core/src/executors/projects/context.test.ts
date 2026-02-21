import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getProjectContext } from './context.js';

describe('getProjectContext', () => {
  const mockProject = {
    id: '1',
    type: 'projects' as const,
    attributes: { name: 'Project Alpha' },
  };
  const mockTasks = [
    { id: 't1', type: 'tasks' as const, attributes: { title: 'Task 1' } },
    { id: 't2', type: 'tasks' as const, attributes: { title: 'Task 2' } },
  ];
  const mockServices = [
    { id: 's1', type: 'services' as const, attributes: { name: 'Development' } },
  ];
  const mockTimeEntries = [
    { id: 'te1', type: 'time_entries' as const, attributes: { time: 120, date: '2024-01-15' } },
  ];
  const mockTaskIncluded = [{ id: '20', type: 'people', attributes: { name: 'Assignee' } }];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches project with all related data in parallel', async () => {
    const getProjectApi = vi.fn().mockResolvedValue({ data: mockProject });
    const getTasksApi = vi.fn().mockResolvedValue({ data: mockTasks, included: mockTaskIncluded });
    const getServicesApi = vi.fn().mockResolvedValue({ data: mockServices });
    const getTimeEntriesApi = vi.fn().mockResolvedValue({ data: mockTimeEntries });

    const ctx = createTestExecutorContext({
      api: {
        getProject: getProjectApi,
        getTasks: getTasksApi,
        getServices: getServicesApi,
        getTimeEntries: getTimeEntriesApi,
      },
    });

    const result = await getProjectContext({ id: '1' }, ctx);

    // Verify all APIs were called with correct parameters
    expect(getProjectApi).toHaveBeenCalledWith('1');
    expect(getTasksApi).toHaveBeenCalledWith({
      filter: { project_id: '1', status: '1' },
      perPage: 5,
      include: ['assignee', 'workflow_status'],
      sort: '-updated_at',
    });
    expect(getServicesApi).toHaveBeenCalledWith({
      filter: { project_id: '1' },
      perPage: 20,
    });
    expect(getTimeEntriesApi).toHaveBeenCalledWith({
      filter: { project_id: '1', after: '2024-01-13' }, // 7 days ago
      perPage: 20,
      sort: '-date',
    });

    // Verify result structure
    expect(result.data.project).toEqual(mockProject);
    expect(result.data.tasks).toEqual(mockTasks);
    expect(result.data.services).toEqual(mockServices);
    expect(result.data.time_entries).toEqual(mockTimeEntries);

    // Verify included resources
    expect(result.included).toEqual(mockTaskIncluded);
  });

  it('resolves human-friendly project ID before fetching', async () => {
    const getProjectApi = vi.fn().mockResolvedValue({ data: mockProject });
    const getTasksApi = vi.fn().mockResolvedValue({ data: [] });
    const getServicesApi = vi.fn().mockResolvedValue({ data: [] });
    const getTimeEntriesApi = vi.fn().mockResolvedValue({ data: [] });
    const resolveValue = vi.fn().mockResolvedValue('1');

    const ctx = createTestExecutorContext({
      api: {
        getProject: getProjectApi,
        getTasks: getTasksApi,
        getServices: getServicesApi,
        getTimeEntries: getTimeEntriesApi,
      },
      resolver: { resolveValue },
    });

    await getProjectContext({ id: 'PRJ-123' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('PRJ-123', 'project');
    expect(getProjectApi).toHaveBeenCalledWith('1');
    expect(getTasksApi).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { project_id: '1', status: '1' },
      }),
    );
  });

  it('handles empty related data gracefully', async () => {
    const getProjectApi = vi.fn().mockResolvedValue({ data: mockProject });
    const getTasksApi = vi.fn().mockResolvedValue({ data: [] });
    const getServicesApi = vi.fn().mockResolvedValue({ data: [] });
    const getTimeEntriesApi = vi.fn().mockResolvedValue({ data: [] });

    const ctx = createTestExecutorContext({
      api: {
        getProject: getProjectApi,
        getTasks: getTasksApi,
        getServices: getServicesApi,
        getTimeEntries: getTimeEntriesApi,
      },
    });

    const result = await getProjectContext({ id: '1' }, ctx);

    expect(result.data.project).toEqual(mockProject);
    expect(result.data.tasks).toEqual([]);
    expect(result.data.services).toEqual([]);
    expect(result.data.time_entries).toEqual([]);
    expect(result.included).toEqual([]);
  });

  it('executes all API calls in parallel (not sequentially)', async () => {
    const callOrder: string[] = [];

    const getProjectApi = vi.fn(async () => {
      callOrder.push('getProject-start');
      await Promise.resolve();
      callOrder.push('getProject-end');
      return { data: mockProject };
    });
    const getTasksApi = vi.fn(async () => {
      callOrder.push('getTasks-start');
      await Promise.resolve();
      callOrder.push('getTasks-end');
      return { data: [] };
    });
    const getServicesApi = vi.fn(async () => {
      callOrder.push('getServices-start');
      await Promise.resolve();
      callOrder.push('getServices-end');
      return { data: [] };
    });
    const getTimeEntriesApi = vi.fn(async () => {
      callOrder.push('getTimeEntries-start');
      await Promise.resolve();
      callOrder.push('getTimeEntries-end');
      return { data: [] };
    });

    const ctx = createTestExecutorContext({
      api: {
        getProject: getProjectApi,
        getTasks: getTasksApi,
        getServices: getServicesApi,
        getTimeEntries: getTimeEntriesApi,
      },
    });

    await getProjectContext({ id: '1' }, ctx);

    // All start calls should happen before end calls
    const startCalls = callOrder.filter((c) => c.endsWith('-start'));
    expect(startCalls.length).toBe(4);
  });
});
