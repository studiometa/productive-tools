import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { getTask } from '../get.js';

describe('getTask', () => {
  const mockTask = {
    id: '1',
    type: 'tasks' as const,
    attributes: { title: 'Fix bug' },
  };
  const mockIncluded = [{ id: '10', type: 'projects', attributes: { name: 'Client' } }];

  it('fetches a task by ID with default includes', async () => {
    const getTaskApi = vi.fn().mockResolvedValue({ data: mockTask, included: mockIncluded });
    const ctx = createTestExecutorContext({
      api: { getTask: getTaskApi },
    });

    const result = await getTask({ id: '1' }, ctx);

    expect(getTaskApi).toHaveBeenCalledWith('1', {
      include: ['project', 'assignee', 'workflow_status'],
    });
    expect(result.data).toEqual(mockTask);
    expect(result.included).toEqual(mockIncluded);
  });

  it('uses custom includes when provided', async () => {
    const getTaskApi = vi.fn().mockResolvedValue({ data: mockTask, included: [] });
    const ctx = createTestExecutorContext({
      api: { getTask: getTaskApi },
    });

    await getTask({ id: '1', include: ['project'] }, ctx);

    expect(getTaskApi).toHaveBeenCalledWith('1', { include: ['project'] });
  });
});
