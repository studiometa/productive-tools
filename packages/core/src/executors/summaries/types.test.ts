import type {
  ProductiveTask,
  ProductiveTimeEntry,
  ProductiveTimer,
} from '@studiometa/productive-api';

import { describe, expect, it } from 'vitest';

import { toSummaryTask, toSummaryTimeEntry, toSummaryTimer } from './types.js';

describe('toSummaryTask', () => {
  it('converts a basic task', () => {
    const task: ProductiveTask = {
      id: '1',
      type: 'tasks',
      attributes: {
        title: 'Test Task',
        due_date: '2026-03-15',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      },
    };

    const result = toSummaryTask(task);

    expect(result).toEqual({
      id: '1',
      title: 'Test Task',
      due_date: '2026-03-15',
      project_name: undefined,
      status: undefined,
    });
  });

  it('resolves project name from included resources', () => {
    const task: ProductiveTask = {
      id: '1',
      type: 'tasks',
      attributes: {
        title: 'Test Task',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      },
      relationships: {
        project: { data: { type: 'projects', id: '100' } },
      },
    };

    const included = [{ id: '100', type: 'projects', attributes: { name: 'Project Alpha' } }];

    const result = toSummaryTask(task, included);

    expect(result.project_name).toBe('Project Alpha');
  });

  it('resolves workflow status from included resources', () => {
    const task: ProductiveTask = {
      id: '1',
      type: 'tasks',
      attributes: {
        title: 'Test Task',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      },
      relationships: {
        workflow_status: { data: { type: 'workflow_statuses', id: '200' } },
      },
    };

    const included = [
      { id: '200', type: 'workflow_statuses', attributes: { name: 'In Progress' } },
    ];

    const result = toSummaryTask(task, included);

    expect(result.status).toBe('In Progress');
  });

  it('handles missing included resources gracefully', () => {
    const task: ProductiveTask = {
      id: '1',
      type: 'tasks',
      attributes: {
        title: 'Test Task',
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-15T00:00:00Z',
      },
      relationships: {
        project: { data: { type: 'projects', id: '100' } },
      },
    };

    // No included resources
    const result = toSummaryTask(task, []);

    expect(result.project_name).toBeUndefined();
  });
});

describe('toSummaryTimeEntry', () => {
  it('converts a basic time entry', () => {
    const entry: ProductiveTimeEntry = {
      id: '10',
      type: 'time_entries',
      attributes: {
        date: '2026-02-21',
        time: 120,
        note: 'Working on feature',
        created_at: '2026-02-21T00:00:00Z',
        updated_at: '2026-02-21T00:00:00Z',
      },
    };

    const result = toSummaryTimeEntry(entry);

    expect(result).toEqual({
      id: '10',
      time: 120,
      note: 'Working on feature',
      service_name: undefined,
      project_name: undefined,
    });
  });

  it('resolves service and project names from included resources', () => {
    const entry: ProductiveTimeEntry = {
      id: '10',
      type: 'time_entries',
      attributes: {
        date: '2026-02-21',
        time: 60,
        created_at: '2026-02-21T00:00:00Z',
        updated_at: '2026-02-21T00:00:00Z',
      },
      relationships: {
        service: { data: { type: 'services', id: '300' } },
        project: { data: { type: 'projects', id: '100' } },
      },
    };

    const included = [
      { id: '300', type: 'services', attributes: { name: 'Development' } },
      { id: '100', type: 'projects', attributes: { name: 'Project Alpha' } },
    ];

    const result = toSummaryTimeEntry(entry, included);

    expect(result.service_name).toBe('Development');
    expect(result.project_name).toBe('Project Alpha');
  });
});

describe('toSummaryTimer', () => {
  it('converts a basic timer', () => {
    const timer: ProductiveTimer = {
      id: '20',
      type: 'timers',
      attributes: {
        started_at: '2026-02-21T09:00:00Z',
        total_time: 45,
        person_id: 1,
      },
    };

    const result = toSummaryTimer(timer);

    expect(result).toEqual({
      id: '20',
      started_at: '2026-02-21T09:00:00Z',
      total_time: 45,
      service_name: undefined,
    });
  });

  it('handles timer without relationships', () => {
    const timer: ProductiveTimer = {
      id: '20',
      type: 'timers',
      attributes: {
        started_at: '2026-02-21T09:00:00Z',
        total_time: 30,
        person_id: 1,
      },
      relationships: {},
    };

    const result = toSummaryTimer(timer, []);

    expect(result.service_name).toBeUndefined();
  });
});
