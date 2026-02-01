import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatTimeEntry,
  formatProject,
  formatTask,
  formatPerson,
  formatService,
  formatBudget,
  formatListResponse,
  formatPagination,
  formatResponse,
} from '../index.js';
import type { JsonApiResource } from '../types.js';

// Mock colors to disable ANSI codes in tests
vi.mock('../../utils/colors.js', () => ({
  isColorEnabled: () => false,
  colors: {
    underline: (s: string) => s,
  },
}));

describe('formatTimeEntry', () => {
  const timeEntry: JsonApiResource = {
    id: '123',
    type: 'time_entries',
    attributes: {
      date: '2024-01-15',
      time: 480,
      note: '<p>Development work</p>',
      billable_time: 480,
      approved: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    },
    relationships: {
      person: { data: { type: 'people', id: '456' } },
      service: { data: { type: 'services', id: '789' } },
      project: { data: { type: 'projects', id: '111' } },
    },
  };

  it('formats time entry with default options', () => {
    const result = formatTimeEntry(timeEntry);

    expect(result).toEqual({
      id: '123',
      date: '2024-01-15',
      time_minutes: 480,
      time_hours: '8.00',
      note: 'Development work', // HTML stripped
      billable_time: 480,
      approved: true,
      person_id: '456',
      service_id: '789',
      project_id: '111',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    });
  });

  it('excludes relationship IDs when disabled', () => {
    const result = formatTimeEntry(timeEntry, { includeRelationshipIds: false });

    expect(result.person_id).toBeUndefined();
    expect(result.service_id).toBeUndefined();
    expect(result.project_id).toBeUndefined();
  });

  it('excludes timestamps when disabled', () => {
    const result = formatTimeEntry(timeEntry, { includeTimestamps: false });

    expect(result.created_at).toBeUndefined();
    expect(result.updated_at).toBeUndefined();
  });

  it('keeps HTML when stripHtml is disabled', () => {
    const result = formatTimeEntry(timeEntry, { stripHtml: false });

    expect(result.note).toBe('<p>Development work</p>');
  });

  it('handles null note', () => {
    const entry: JsonApiResource = {
      ...timeEntry,
      attributes: { ...timeEntry.attributes, note: null },
    };
    const result = formatTimeEntry(entry);

    expect(result.note).toBeNull();
  });
});

describe('formatProject', () => {
  const project: JsonApiResource = {
    id: '123',
    type: 'projects',
    attributes: {
      name: 'Test Project',
      project_number: 'PRJ-001',
      archived: false,
      budget: 50000,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    },
  };

  it('formats project with default options', () => {
    const result = formatProject(project);

    expect(result).toEqual({
      id: '123',
      name: 'Test Project',
      number: 'PRJ-001',
      archived: false,
      budget: 50000,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    });
  });

  it('handles missing project number', () => {
    const proj: JsonApiResource = {
      ...project,
      attributes: { ...project.attributes, project_number: undefined },
    };
    const result = formatProject(proj);

    expect(result.number).toBeNull();
  });
});

describe('formatTask', () => {
  const task: JsonApiResource = {
    id: '123',
    type: 'tasks',
    attributes: {
      title: 'Implement feature',
      number: 42,
      closed: false,
      due_date: '2024-02-01',
      initial_estimate: 480,
      worked_time: 240,
      remaining_time: 240,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
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
      relationships: {
        company: { data: { type: 'companies', id: '222' } },
      },
    },
    {
      id: '789',
      type: 'people',
      attributes: { first_name: 'John', last_name: 'Doe' },
    },
    {
      id: '111',
      type: 'workflow_statuses',
      attributes: { name: 'In Progress' },
    },
    {
      id: '222',
      type: 'companies',
      attributes: { name: 'Acme Corp' },
    },
  ];

  it('formats task with default options', () => {
    const result = formatTask(task);

    expect(result.id).toBe('123');
    expect(result.title).toBe('Implement feature');
    expect(result.number).toBe(42);
    expect(result.closed).toBe(false);
    expect(result.due_date).toBe('2024-02-01');
    expect(result.initial_estimate).toBe(480);
    expect(result.worked_time).toBe(240);
    expect(result.project_id).toBe('456');
    expect(result.assignee_id).toBe('789');
    expect(result.status_id).toBe('111');
  });

  it('resolves relationship names from included resources', () => {
    const result = formatTask(task, { included });

    expect(result.project_name).toBe('Test Project');
    expect(result.assignee_name).toBe('John Doe');
    expect(result.status_name).toBe('In Progress');
    expect(result.project).toEqual({
      id: '456',
      name: 'Test Project',
      number: 'PRJ-001',
    });
    expect(result.company).toEqual({
      id: '222',
      name: 'Acme Corp',
    });
  });

  it('handles missing relationships gracefully', () => {
    const taskNoRels: JsonApiResource = {
      ...task,
      relationships: undefined,
    };
    const result = formatTask(taskNoRels);

    expect(result.project_id).toBeUndefined();
    expect(result.assignee_id).toBeUndefined();
  });
});

describe('formatPerson', () => {
  const person: JsonApiResource = {
    id: '123',
    type: 'people',
    attributes: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      active: true,
      title: 'Developer',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    },
  };

  it('formats person with combined name', () => {
    const result = formatPerson(person);

    expect(result).toEqual({
      id: '123',
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      active: true,
      title: 'Developer',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    });
  });
});

describe('formatService', () => {
  const service: JsonApiResource = {
    id: '123',
    type: 'services',
    attributes: {
      name: 'Development',
      budgeted_time: 1000,
      worked_time: 500,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    },
  };

  it('formats service', () => {
    const result = formatService(service);

    expect(result).toEqual({
      id: '123',
      name: 'Development',
      budgeted_time: 1000,
      worked_time: 500,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    });
  });
});

describe('formatBudget', () => {
  const budget: JsonApiResource = {
    id: '123',
    type: 'budgets',
    attributes: {
      total_time_budget: 1000,
      remaining_time_budget: 500,
      total_monetary_budget: 50000,
      remaining_monetary_budget: 25000,
    },
  };

  it('formats budget', () => {
    const result = formatBudget(budget);

    expect(result).toEqual({
      id: '123',
      total_time_budget: 1000,
      remaining_time_budget: 500,
      total_monetary_budget: 50000,
      remaining_monetary_budget: 25000,
    });
  });
});

describe('formatPagination', () => {
  it('formats pagination metadata', () => {
    const meta = {
      current_page: 2,
      total_pages: 10,
      total_count: 250,
      page_size: 25,
    };

    const result = formatPagination(meta);

    expect(result).toEqual({
      page: 2,
      total_pages: 10,
      total_count: 250,
    });
  });

  it('returns undefined for single page', () => {
    const meta = {
      current_page: 1,
      total_pages: 1,
      total_count: 10,
      page_size: 100,
    };

    const result = formatPagination(meta);

    expect(result).toBeUndefined();
  });

  it('handles missing metadata', () => {
    expect(formatPagination(undefined)).toBeUndefined();
    expect(formatPagination({})).toBeUndefined();
  });

  it('calculates total pages from total count', () => {
    const meta = {
      page: 1,
      total: 250,
      per_page: 100,
    };

    const result = formatPagination(meta);

    expect(result).toEqual({
      page: 1,
      total_pages: 3,
      total_count: 250,
    });
  });
});

describe('formatListResponse', () => {
  const projects: JsonApiResource[] = [
    {
      id: '1',
      type: 'projects',
      attributes: { name: 'Project 1', archived: false },
    },
    {
      id: '2',
      type: 'projects',
      attributes: { name: 'Project 2', archived: true },
    },
  ];

  it('formats list with pagination', () => {
    const meta = { current_page: 1, total_pages: 5, total_count: 100 };

    const result = formatListResponse(projects, formatProject, meta);

    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Project 1');
    expect(result.meta).toEqual({
      page: 1,
      total_pages: 5,
      total_count: 100,
    });
  });

  it('omits meta for single page', () => {
    const meta = { current_page: 1, total_pages: 1, total_count: 2 };

    const result = formatListResponse(projects, formatProject, meta);

    expect(result.meta).toBeUndefined();
  });

  it('passes options to formatter', () => {
    const result = formatListResponse(projects, formatProject, undefined, {
      includeTimestamps: false,
    });

    expect(result.data[0].created_at).toBeUndefined();
  });
});

describe('formatResponse', () => {
  it('auto-detects type and formats list', () => {
    const response = {
      data: [
        { id: '1', type: 'projects', attributes: { name: 'Test', archived: false } },
      ],
      meta: { total_pages: 1, total_count: 1 },
    };

    const result = formatResponse(response) as { data: Array<{ name: string }> };

    expect(result.data[0].name).toBe('Test');
  });

  it('auto-detects type and formats single resource', () => {
    const response = {
      data: { id: '1', type: 'projects', attributes: { name: 'Test', archived: false } },
    };

    const result = formatResponse(response) as { name: string };

    expect(result.name).toBe('Test');
  });

  it('passes included resources to formatters', () => {
    const response = {
      data: [
        {
          id: '1',
          type: 'tasks',
          attributes: { title: 'Task 1', closed: false },
          relationships: { project: { data: { type: 'projects', id: '2' } } },
        },
      ],
      included: [
        { id: '2', type: 'projects', attributes: { name: 'Project Name' } },
      ],
    };

    const result = formatResponse(response) as { data: Array<{ project_name: string }> };

    expect(result.data[0].project_name).toBe('Project Name');
  });
});
