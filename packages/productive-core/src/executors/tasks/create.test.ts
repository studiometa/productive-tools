import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { createTask } from './create.js';

describe('createTask', () => {
  const mockTask = {
    id: '999',
    type: 'tasks' as const,
    attributes: { title: 'New Task' },
  };

  it('creates a task with required fields', async () => {
    const createTaskApi = vi.fn().mockResolvedValue({ data: mockTask });
    const ctx = createTestExecutorContext({ api: { createTask: createTaskApi } });

    const result = await createTask(
      { title: 'New Task', projectId: '100', taskListId: '200' },
      ctx,
    );

    expect(createTaskApi).toHaveBeenCalledWith({
      title: 'New Task',
      project_id: '100',
      task_list_id: '200',
      assignee_id: undefined,
      description: undefined,
      due_date: undefined,
      start_date: undefined,
      initial_estimate: undefined,
      workflow_status_id: undefined,
      private: undefined,
    });
    expect(result.data).toEqual(mockTask);
  });

  it('passes all optional fields', async () => {
    const createTaskApi = vi.fn().mockResolvedValue({ data: mockTask });
    const ctx = createTestExecutorContext({ api: { createTask: createTaskApi } });

    await createTask(
      {
        title: 'Full Task',
        projectId: '100',
        taskListId: '200',
        assigneeId: '300',
        description: 'Detailed description',
        dueDate: '2026-03-15',
        startDate: '2026-03-01',
        initialEstimate: 480,
        workflowStatusId: '5',
        isPrivate: true,
      },
      ctx,
    );

    expect(createTaskApi).toHaveBeenCalledWith({
      title: 'Full Task',
      project_id: '100',
      task_list_id: '200',
      assignee_id: '300',
      description: 'Detailed description',
      due_date: '2026-03-15',
      start_date: '2026-03-01',
      initial_estimate: 480,
      workflow_status_id: '5',
      private: true,
    });
  });
});
