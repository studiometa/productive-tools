import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../time/index.js';
import { updateTask } from './update.js';

describe('updateTask', () => {
  const mockTask = {
    id: '123',
    type: 'tasks' as const,
    attributes: { title: 'Updated Task' },
  };

  it('updates a task with provided fields', async () => {
    const updateTaskApi = vi.fn().mockResolvedValue({ data: mockTask });
    const ctx = createTestExecutorContext({ api: { updateTask: updateTaskApi } });

    const result = await updateTask(
      { id: '123', title: 'Updated Task', description: 'New description' },
      ctx,
    );

    expect(updateTaskApi).toHaveBeenCalledWith('123', {
      title: 'Updated Task',
      description: 'New description',
    });
    expect(result.data).toEqual(mockTask);
  });

  it('only sends defined fields', async () => {
    const updateTaskApi = vi.fn().mockResolvedValue({ data: mockTask });
    const ctx = createTestExecutorContext({ api: { updateTask: updateTaskApi } });

    await updateTask({ id: '123', title: 'Only title' }, ctx);

    const apiData = updateTaskApi.mock.calls[0][1];
    expect(apiData.title).toBe('Only title');
    expect(apiData.description).toBeUndefined();
  });

  it('throws validation error when no updates provided', async () => {
    const ctx = createTestExecutorContext();

    await expect(updateTask({ id: '123' }, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(updateTask({ id: '123' }, ctx)).rejects.toThrow('No updates specified');
  });

  it('maps all optional fields correctly', async () => {
    const updateTaskApi = vi.fn().mockResolvedValue({ data: mockTask });
    const ctx = createTestExecutorContext({ api: { updateTask: updateTaskApi } });

    await updateTask(
      {
        id: '123',
        dueDate: '2026-04-01',
        startDate: '2026-03-15',
        initialEstimate: 240,
        isPrivate: true,
        assigneeId: '500',
        workflowStatusId: '3',
      },
      ctx,
    );

    expect(updateTaskApi).toHaveBeenCalledWith('123', {
      due_date: '2026-04-01',
      start_date: '2026-03-15',
      initial_estimate: 240,
      private: true,
      assignee_id: '500',
      workflow_status_id: '3',
    });
  });
});
