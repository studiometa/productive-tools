import { describe, it, expect } from 'vitest';

import type { JsonApiResource } from './types.js';

import { formatTask } from './task.js';

const task: JsonApiResource = {
  id: '123',
  type: 'tasks',
  attributes: {
    title: 'Implement feature',
    number: 42,
    closed: false,
    due_date: '2024-02-01',
    description: '<p>Do stuff</p>',
    initial_estimate: 480,
    worked_time: 240,
    remaining_time: 240,
    created_at: '2024-01-01',
    updated_at: '2024-01-15',
  },
  relationships: {
    project: { data: { type: 'projects', id: '456' } },
    assignee: { data: { type: 'people', id: '789' } },
    workflow_status: { data: { type: 'workflow_statuses', id: '111' } },
  },
};

const included: JsonApiResource[] = [
  {
    id: '456',
    type: 'projects',
    attributes: { name: 'Test Project', project_number: 'PRJ-001' },
    relationships: { company: { data: { type: 'companies', id: '222' } } },
  },
  { id: '789', type: 'people', attributes: { first_name: 'John', last_name: 'Doe' } },
  { id: '111', type: 'workflow_statuses', attributes: { name: 'In Progress' } },
  { id: '222', type: 'companies', attributes: { name: 'Acme Corp' } },
];

describe('formatTask', () => {
  it('formats with default options', () => {
    const r = formatTask(task);
    expect(r.id).toBe('123');
    expect(r.title).toBe('Implement feature');
    expect(r.number).toBe(42);
    expect(r.closed).toBe(false);
    expect(r.due_date).toBe('2024-02-01');
    expect(r.description).toBe('Do stuff'); // HTML stripped
    expect(r.initial_estimate).toBe(480);
    expect(r.worked_time).toBe(240);
    expect(r.remaining_time).toBe(240);
    expect(r.project_id).toBe('456');
    expect(r.assignee_id).toBe('789');
    expect(r.status_id).toBe('111');
  });

  it('resolves relationships from included', () => {
    const r = formatTask(task, { included });
    expect(r.project_name).toBe('Test Project');
    expect(r.assignee_name).toBe('John Doe');
    expect(r.status_name).toBe('In Progress');
    expect(r.project).toEqual({ id: '456', name: 'Test Project', number: 'PRJ-001' });
    expect(r.company).toEqual({ id: '222', name: 'Acme Corp' });
  });

  it('handles missing relationships', () => {
    const r = formatTask({ ...task, relationships: undefined });
    expect(r.project_id).toBeUndefined();
    expect(r.assignee_id).toBeUndefined();
    expect(r.status_id).toBeUndefined();
  });

  it('handles task_number alias', () => {
    const r = formatTask({ id: '1', type: 'tasks', attributes: { task_number: 99 } });
    expect(r.number).toBe(99);
  });

  it('keeps HTML when stripHtml is disabled', () => {
    const r = formatTask(task, { stripHtml: false });
    expect(r.description).toBe('<p>Do stuff</p>');
  });

  it('defaults title to Untitled', () => {
    const r = formatTask({ id: '1', type: 'tasks', attributes: {} });
    expect(r.title).toBe('Untitled');
    expect(r.closed).toBe(false);
  });

  it('excludes timestamps when disabled', () => {
    const r = formatTask(task, { includeTimestamps: false });
    expect(r.created_at).toBeUndefined();
  });

  it('excludes relationship IDs when disabled', () => {
    const r = formatTask(task, { includeRelationshipIds: false });
    expect(r.project_id).toBeUndefined();
    expect(r.assignee_id).toBeUndefined();
    expect(r.status_id).toBeUndefined();
  });

  it('handles project without company', () => {
    const incl = [{ id: '456', type: 'projects', attributes: { name: 'P' } }];
    const r = formatTask(task, { included: incl });
    expect(r.project_name).toBe('P');
    expect(r.company).toBeUndefined();
  });

  it('handles null description', () => {
    const r = formatTask({ id: '1', type: 'tasks', attributes: { description: null } });
    expect(r.description).toBeNull();
  });
});
