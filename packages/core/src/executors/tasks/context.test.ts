import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getTaskContext } from './context.js';

describe('getTaskContext', () => {
  const mockTask = {
    id: '1',
    type: 'tasks' as const,
    attributes: { title: 'Main task' },
  };
  const mockComments = [
    { id: 'c1', type: 'comments' as const, attributes: { body: 'Comment 1' } },
    { id: 'c2', type: 'comments' as const, attributes: { body: 'Comment 2' } },
  ];
  const mockTimeEntries = [
    { id: 't1', type: 'time_entries' as const, attributes: { time: 60, date: '2024-01-15' } },
  ];
  const mockSubtasks = [
    { id: '2', type: 'tasks' as const, attributes: { title: 'Subtask 1' } },
    { id: '3', type: 'tasks' as const, attributes: { title: 'Subtask 2' } },
  ];
  const mockTaskIncluded = [{ id: '10', type: 'projects', attributes: { name: 'Project' } }];
  const mockCommentIncluded = [{ id: '20', type: 'people', attributes: { name: 'Creator' } }];
  const mockSubtaskIncluded = [{ id: '21', type: 'people', attributes: { name: 'Assignee' } }];

  it('fetches task with all related data in parallel', async () => {
    const getTaskApi = vi.fn().mockResolvedValue({ data: mockTask, included: mockTaskIncluded });
    const getCommentsApi = vi
      .fn()
      .mockResolvedValue({ data: mockComments, included: mockCommentIncluded });
    const getTimeEntriesApi = vi.fn().mockResolvedValue({ data: mockTimeEntries, included: [] });
    const getTasksApi = vi
      .fn()
      .mockResolvedValue({ data: mockSubtasks, included: mockSubtaskIncluded });

    const ctx = createTestExecutorContext({
      api: {
        getTask: getTaskApi,
        getComments: getCommentsApi,
        getTimeEntries: getTimeEntriesApi,
        getTasks: getTasksApi,
      },
    });

    const result = await getTaskContext({ id: '1' }, ctx);

    // Verify all APIs were called with correct parameters
    expect(getTaskApi).toHaveBeenCalledWith('1', {
      include: ['project', 'assignee', 'workflow_status', 'service', 'creator', 'parent_task'],
    });
    expect(getCommentsApi).toHaveBeenCalledWith({
      filter: { task_id: '1' },
      perPage: 20,
      include: ['creator'],
    });
    expect(getTimeEntriesApi).toHaveBeenCalledWith({
      filter: { task_id: '1' },
      perPage: 20,
      sort: '-date',
    });
    expect(getTasksApi).toHaveBeenCalledWith({
      filter: { parent_task_id: '1', status: '1' },
      perPage: 20,
      include: ['assignee', 'workflow_status'],
    });

    // Verify result structure
    expect(result.data.task).toEqual(mockTask);
    expect(result.data.comments).toEqual(mockComments);
    expect(result.data.time_entries).toEqual(mockTimeEntries);
    expect(result.data.subtasks).toEqual(mockSubtasks);

    // Verify included resources are merged
    expect(result.included).toEqual([
      ...mockTaskIncluded,
      ...mockCommentIncluded,
      ...mockSubtaskIncluded,
    ]);
  });

  it('handles empty related data gracefully', async () => {
    const getTaskApi = vi.fn().mockResolvedValue({ data: mockTask });
    const getCommentsApi = vi.fn().mockResolvedValue({ data: [] });
    const getTimeEntriesApi = vi.fn().mockResolvedValue({ data: [] });
    const getTasksApi = vi.fn().mockResolvedValue({ data: [] });

    const ctx = createTestExecutorContext({
      api: {
        getTask: getTaskApi,
        getComments: getCommentsApi,
        getTimeEntries: getTimeEntriesApi,
        getTasks: getTasksApi,
      },
    });

    const result = await getTaskContext({ id: '1' }, ctx);

    expect(result.data.task).toEqual(mockTask);
    expect(result.data.comments).toEqual([]);
    expect(result.data.time_entries).toEqual([]);
    expect(result.data.subtasks).toEqual([]);
    expect(result.included).toEqual([]);
  });

  it('executes all API calls in parallel (not sequentially)', async () => {
    const callOrder: string[] = [];

    const getTaskApi = vi.fn(async () => {
      callOrder.push('getTask-start');
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push('getTask-end');
      return { data: mockTask };
    });
    const getCommentsApi = vi.fn(async () => {
      callOrder.push('getComments-start');
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push('getComments-end');
      return { data: [] };
    });
    const getTimeEntriesApi = vi.fn(async () => {
      callOrder.push('getTimeEntries-start');
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push('getTimeEntries-end');
      return { data: [] };
    });
    const getTasksApi = vi.fn(async () => {
      callOrder.push('getTasks-start');
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push('getTasks-end');
      return { data: [] };
    });

    const ctx = createTestExecutorContext({
      api: {
        getTask: getTaskApi,
        getComments: getCommentsApi,
        getTimeEntries: getTimeEntriesApi,
        getTasks: getTasksApi,
      },
    });

    await getTaskContext({ id: '1' }, ctx);

    // All start calls should come before any end calls (parallel execution)
    const startCalls = callOrder.filter((c) => c.endsWith('-start'));
    const endCalls = callOrder.filter((c) => c.endsWith('-end'));
    expect(startCalls.length).toBe(4);
    expect(endCalls.length).toBe(4);

    // Verify all starts happen before all ends (parallel)
    const firstEndIndex = callOrder.findIndex((c) => c.endsWith('-end'));
    const lastStartIndex = callOrder.lastIndexOf(
      callOrder.filter((c) => c.endsWith('-start')).pop()!,
    );
    expect(lastStartIndex).toBeLessThan(firstEndIndex);
  });
});
