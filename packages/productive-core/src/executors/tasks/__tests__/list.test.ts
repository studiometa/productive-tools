import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { buildTaskFilters, listTasks } from '../list.js';

describe('buildTaskFilters', () => {
  it('maps status "open" to "1"', () => {
    const filters = buildTaskFilters({ status: 'open' });
    expect(filters.status).toBe('1');
  });

  it('maps status "completed" to "2"', () => {
    const filters = buildTaskFilters({ status: 'completed' });
    expect(filters.status).toBe('2');
  });

  it('maps status "done" to "2"', () => {
    const filters = buildTaskFilters({ status: 'done' });
    expect(filters.status).toBe('2');
  });

  it('defaults status to "1" (open) when not specified', () => {
    const filters = buildTaskFilters({});
    expect(filters.status).toBe('1');
  });

  it('maps overdue to overdue_status "2"', () => {
    const filters = buildTaskFilters({ overdue: true });
    expect(filters.overdue_status).toBe('2');
  });

  it('does not add overdue_status when overdue is false', () => {
    const filters = buildTaskFilters({ overdue: false });
    expect(filters.overdue_status).toBeUndefined();
  });

  it('maps typed options to API filter names', () => {
    const filters = buildTaskFilters({
      assigneeId: '100',
      creatorId: '200',
      projectId: '300',
      companyId: '400',
      boardId: '500',
      taskListId: '600',
      parentTaskId: '700',
      workflowStatusId: '800',
    });
    expect(filters).toEqual(
      expect.objectContaining({
        assignee_id: '100',
        creator_id: '200',
        project_id: '300',
        company_id: '400',
        board_id: '500',
        task_list_id: '600',
        parent_task_id: '700',
        workflow_status_id: '800',
      }),
    );
  });

  it('does not set status filter for unknown status values', () => {
    const filters = buildTaskFilters({ status: 'unknown_status' });
    expect(filters.status).toBeUndefined();
  });

  it('maps due date filters', () => {
    const filters = buildTaskFilters({
      dueDate: '2026-03-15',
      dueBefore: '2026-04-01',
      dueAfter: '2026-03-01',
    });
    expect(filters.due_date_on).toBe('2026-03-15');
    expect(filters.due_date_before).toBe('2026-04-01');
    expect(filters.due_date_after).toBe('2026-03-01');
  });

  it('merges additionalFilters', () => {
    const filters = buildTaskFilters({
      assigneeId: '100',
      additionalFilters: { custom: 'value', project_id: '999' },
    });
    // additionalFilters are applied first, then typed options override
    expect(filters.assignee_id).toBe('100');
    expect(filters.custom).toBe('value');
    // project_id from additionalFilters since projectId not set
    expect(filters.project_id).toBe('999');
  });
});

describe('listTasks', () => {
  const mockResponse = {
    data: [{ id: '1', type: 'tasks', attributes: { title: 'Task 1' } }],
    meta: { current_page: 1, total_pages: 1 },
    included: [{ id: '10', type: 'projects', attributes: { name: 'Project A' } }],
  };

  it('resolves filters through resolver', async () => {
    const getTasks = vi.fn().mockResolvedValue(mockResponse);
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { assignee_id: '100', status: '1' },
      metadata: { assignee_id: { original: 'John', resolved: '100', type: 'person' } },
    });
    const ctx = createTestExecutorContext({
      api: { getTasks },
      resolver: { resolveFilters },
    });

    const result = await listTasks({ assigneeId: 'John' }, ctx);

    expect(resolveFilters).toHaveBeenCalled();
    const callFilter = resolveFilters.mock.calls[0][0];
    expect(callFilter.assignee_id).toBe('John');
    expect(result.resolved).toBeDefined();
    expect(result.data).toEqual(mockResponse.data);
    expect(result.included).toEqual(mockResponse.included);
  });

  it('passes include and sort to API', async () => {
    const getTasks = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getTasks } });

    await listTasks(
      { include: ['project', 'assignee'], sort: '-created_at', page: 2, perPage: 50 },
      ctx,
    );

    expect(getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        include: ['project', 'assignee'],
        sort: '-created_at',
        page: 2,
        perPage: 50,
      }),
    );
  });

  it('uses default include when not specified', async () => {
    const getTasks = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getTasks } });

    await listTasks({}, ctx);

    expect(getTasks).toHaveBeenCalledWith(
      expect.objectContaining({
        include: ['project', 'assignee', 'workflow_status'],
      }),
    );
  });

  it('returns no resolved metadata when filters are unchanged', async () => {
    const getTasks = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getTasks } });

    const result = await listTasks({ projectId: '300' }, ctx);

    expect(result.resolved).toBeUndefined();
  });
});
