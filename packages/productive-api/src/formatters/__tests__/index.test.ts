import { describe, it, expect } from 'vitest';

import type { JsonApiResource } from '../types.js';

import {
  formatProject,
  formatListResponse,
  formatSingleResponse,
  formatResponse,
} from '../index.js';

describe('formatListResponse', () => {
  const projects: JsonApiResource[] = [
    { id: '1', type: 'projects', attributes: { name: 'Project 1', archived: false } },
    { id: '2', type: 'projects', attributes: { name: 'Project 2', archived: true } },
  ];

  it('formats list with pagination', () => {
    const meta = { current_page: 1, total_pages: 5, total_count: 100 };
    const result = formatListResponse(projects, formatProject, meta);

    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Project 1');
    expect(result.meta).toEqual({ page: 1, total_pages: 5, total_count: 100 });
  });

  it('omits meta for single page', () => {
    const result = formatListResponse(projects, formatProject, {
      current_page: 1,
      total_pages: 1,
      total_count: 2,
    });
    expect(result.meta).toBeUndefined();
  });

  it('passes options to formatter', () => {
    const result = formatListResponse(projects, formatProject, undefined, {
      includeTimestamps: false,
    });
    expect(result.data[0].created_at).toBeUndefined();
  });

  it('handles empty list', () => {
    const result = formatListResponse([], formatProject);
    expect(result.data).toEqual([]);
    expect(result.meta).toBeUndefined();
  });
});

describe('formatSingleResponse', () => {
  it('formats a single resource', () => {
    const project: JsonApiResource = {
      id: '1',
      type: 'projects',
      attributes: { name: 'Test', archived: false },
    };
    const result = formatSingleResponse(project, formatProject);
    expect(result.name).toBe('Test');
  });

  it('passes options to formatter', () => {
    const project: JsonApiResource = {
      id: '1',
      type: 'projects',
      attributes: { name: 'Test', created_at: 'x' },
    };
    const result = formatSingleResponse(project, formatProject, { includeTimestamps: false });
    expect(result.created_at).toBeUndefined();
  });
});

describe('formatResponse', () => {
  it('auto-formats list response', () => {
    const response = {
      data: [{ id: '1', type: 'projects', attributes: { name: 'Test', archived: false } }],
      meta: { total_pages: 1, total_count: 1 },
    };
    const result = formatResponse(response) as { data: Array<{ name: string }> };
    expect(result.data[0].name).toBe('Test');
  });

  it('auto-formats single resource', () => {
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
      included: [{ id: '2', type: 'projects', attributes: { name: 'Project Name' } }],
    };
    const result = formatResponse(response) as { data: Array<{ project_name: string }> };
    expect(result.data[0].project_name).toBe('Project Name');
  });

  it('auto-formats all known types', () => {
    const types = [
      'time_entries',
      'tasks',
      'projects',
      'people',
      'services',
      'budgets',
      'companies',
      'comments',
      'timers',
      'deals',
      'bookings',
    ];
    for (const type of types) {
      const r = formatResponse({ data: [{ id: '1', type, attributes: {} }] }) as {
        data: unknown[];
      };
      expect(r.data).toHaveLength(1);
    }
  });

  it('uses generic formatter for unknown types', () => {
    const r = formatResponse({
      data: [{ id: '1', type: 'unknown_type', attributes: { foo: 'bar' } }],
    }) as { data: Array<{ id: string; foo: string }> };
    expect(r.data[0].id).toBe('1');
    expect(r.data[0].foo).toBe('bar');
  });
});
