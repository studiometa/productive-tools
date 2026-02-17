import { describe, expect, it } from 'vitest';

import { formatProject } from '../project.js';

const mockProject = {
  id: '123',
  type: 'projects',
  attributes: {
    name: 'Test Project',
    project_number: 'PRJ-001',
    archived: false,
    budget: 50000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
};

describe('formatProject', () => {
  it('formats with default options', () => {
    const result = formatProject(mockProject);
    expect(result.id).toBe('123');
    expect(result.name).toBe('Test Project');
    expect(result.number).toBe('PRJ-001');
    expect(result.archived).toBe(false);
  });

  it('includes timestamps by default', () => {
    const result = formatProject(mockProject);
    expect(result.created_at).toBe('2026-01-01T00:00:00Z');
    expect(result.updated_at).toBe('2026-01-15T00:00:00Z');
  });

  it('excludes timestamps when option is false', () => {
    const result = formatProject(mockProject, { includeTimestamps: false });
    expect(result.created_at).toBeUndefined();
    expect(result.updated_at).toBeUndefined();
  });
});
