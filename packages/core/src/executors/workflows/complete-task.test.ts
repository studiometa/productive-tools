import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../errors.js';
import { completeTask } from './complete-task.js';

describe('completeTask', () => {
  const mockTask = {
    data: {
      id: '42',
      type: 'tasks',
      attributes: { title: 'Fix the bug', closed: false, due_date: null },
      relationships: {},
    },
  };

  const mockUpdatedTask = {
    data: {
      id: '42',
      type: 'tasks',
      attributes: { title: 'Fix the bug', closed: true, due_date: null },
      relationships: {},
    },
  };

  const mockComment = {
    data: {
      id: '99',
      type: 'comments',
      attributes: { body: 'Done!' },
      relationships: {},
    },
  };

  const mockTimer = {
    id: 'timer-1',
    type: 'timers',
    attributes: { started_at: '2026-02-22T09:00:00Z', total_time: 3600 },
    relationships: {},
  };

  const mockTimersResponse = {
    data: [mockTimer],
    meta: {},
  };

  it('throws ExecutorValidationError when taskId is missing', async () => {
    const ctx = createTestExecutorContext();
    await expect(completeTask({ taskId: '' }, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(completeTask({ taskId: '' }, ctx)).rejects.toThrow('taskId is required');
  });

  it('throws ExecutorValidationError when task fetch fails', async () => {
    const getTask = vi.fn().mockRejectedValue(new Error('Not found'));
    const ctx = createTestExecutorContext({ api: { getTask } });

    await expect(completeTask({ taskId: '42' }, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(completeTask({ taskId: '42' }, ctx)).rejects.toThrow('Failed to fetch task 42');
  });

  it('marks task as closed and returns result', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockResolvedValue(mockUpdatedTask);
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({ api: { getTask, updateTask, getTimers } });

    const result = await completeTask({ taskId: '42' }, ctx);

    expect(result.data.workflow).toBe('complete_task');
    expect(result.data.task.id).toBe('42');
    expect(result.data.task.title).toBe('Fix the bug');
    expect(result.data.task.closed).toBe(true);
    expect(result.data.comment_posted).toBe(false);
    expect(result.data.comment_id).toBeUndefined();
    expect(result.data.timers_stopped).toBe(0);
    expect(result.data.errors).toHaveLength(0);
  });

  it('calls updateTask with closed=true', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockResolvedValue(mockUpdatedTask);
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({ api: { getTask, updateTask, getTimers } });

    await completeTask({ taskId: '42' }, ctx);

    expect(updateTask).toHaveBeenCalledWith('42', { closed: true });
  });

  it('posts a comment when comment option is provided', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockResolvedValue(mockUpdatedTask);
    const createComment = vi.fn().mockResolvedValue(mockComment);
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({
      api: { getTask, updateTask, createComment, getTimers },
    });

    const result = await completeTask({ taskId: '42', comment: 'Done!' }, ctx);

    expect(createComment).toHaveBeenCalledWith({ body: 'Done!', task_id: '42' });
    expect(result.data.comment_posted).toBe(true);
    expect(result.data.comment_id).toBe('99');
  });

  it('does not post a comment when no comment provided', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockResolvedValue(mockUpdatedTask);
    const createComment = vi.fn();
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({
      api: { getTask, updateTask, createComment, getTimers },
    });

    await completeTask({ taskId: '42' }, ctx);

    expect(createComment).not.toHaveBeenCalled();
  });

  it('stops running timers by default', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockResolvedValue(mockUpdatedTask);
    const getTimers = vi.fn().mockResolvedValue(mockTimersResponse);
    const stopTimer = vi.fn().mockResolvedValue({ data: mockTimer });

    const ctx = createTestExecutorContext({
      api: { getTask, updateTask, getTimers, stopTimer },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await completeTask({ taskId: '42' }, ctx);

    expect(getTimers).toHaveBeenCalledWith(
      expect.objectContaining({ filter: { person_id: 'user-1' } }),
    );
    expect(stopTimer).toHaveBeenCalledWith('timer-1');
    expect(result.data.timers_stopped).toBe(1);
  });

  it('does not stop timers when stop_timer=false', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockResolvedValue(mockUpdatedTask);
    const getTimers = vi.fn();
    const stopTimer = vi.fn();

    const ctx = createTestExecutorContext({ api: { getTask, updateTask, getTimers, stopTimer } });

    const result = await completeTask({ taskId: '42', stopTimer: false }, ctx);

    expect(getTimers).not.toHaveBeenCalled();
    expect(stopTimer).not.toHaveBeenCalled();
    expect(result.data.timers_stopped).toBe(0);
  });

  it('reports errors for failed sub-steps without aborting', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockRejectedValue(new Error('Update failed'));
    const createComment = vi.fn().mockRejectedValue(new Error('Comment failed'));
    const getTimers = vi.fn().mockResolvedValue({ data: [], meta: {} });

    const ctx = createTestExecutorContext({
      api: { getTask, updateTask, createComment, getTimers },
    });

    const result = await completeTask({ taskId: '42', comment: 'Done!' }, ctx);

    expect(result.data.errors).toHaveLength(2);
    expect(result.data.errors[0]).toContain('Failed to mark task as closed');
    expect(result.data.errors[1]).toContain('Failed to post comment');
    // Still returns a result
    expect(result.data.workflow).toBe('complete_task');
  });

  it('handles timer stop failures as partial errors', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockResolvedValue(mockUpdatedTask);
    const getTimers = vi.fn().mockResolvedValue(mockTimersResponse);
    const stopTimer = vi.fn().mockRejectedValue(new Error('Timer stop failed'));

    const ctx = createTestExecutorContext({ api: { getTask, updateTask, getTimers, stopTimer } });

    const result = await completeTask({ taskId: '42' }, ctx);

    expect(result.data.timers_stopped).toBe(0);
    expect(result.data.errors).toHaveLength(1);
    expect(result.data.errors[0]).toContain('Failed to stop timer');
  });

  it('completes all steps successfully in one call', async () => {
    const getTask = vi.fn().mockResolvedValue(mockTask);
    const updateTask = vi.fn().mockResolvedValue(mockUpdatedTask);
    const createComment = vi.fn().mockResolvedValue(mockComment);
    const getTimers = vi.fn().mockResolvedValue(mockTimersResponse);
    const stopTimer = vi.fn().mockResolvedValue({ data: mockTimer });

    const ctx = createTestExecutorContext({
      api: { getTask, updateTask, createComment, getTimers, stopTimer },
      config: { userId: 'user-1', organizationId: 'org-1' },
    });

    const result = await completeTask({ taskId: '42', comment: 'All done!' }, ctx);

    expect(result.data.task.closed).toBe(true);
    expect(result.data.comment_posted).toBe(true);
    expect(result.data.timers_stopped).toBe(1);
    expect(result.data.errors).toHaveLength(0);
  });
});
