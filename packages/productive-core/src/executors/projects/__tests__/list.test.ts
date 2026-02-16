import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { buildProjectFilters, listProjects } from '../list.js';

describe('buildProjectFilters', () => {
  it('returns empty object for empty options', () => {
    expect(buildProjectFilters({})).toEqual({});
  });

  it('maps resource ID options', () => {
    const result = buildProjectFilters({
      companyId: '123',
      responsibleId: '456',
      personId: '789',
    });
    expect(result).toEqual({
      company_id: '123',
      responsible_id: '456',
      person_id: '789',
    });
  });

  it('maps project type to API value', () => {
    expect(buildProjectFilters({ projectType: 'internal' })).toEqual({ project_type: '1' });
    expect(buildProjectFilters({ projectType: 'client' })).toEqual({ project_type: '2' });
  });

  it('maps status to API value', () => {
    expect(buildProjectFilters({ status: 'active' })).toEqual({ status: '1' });
    expect(buildProjectFilters({ status: 'archived' })).toEqual({ status: '2' });
  });

  it('ignores unknown enum values', () => {
    expect(buildProjectFilters({ projectType: 'unknown' })).toEqual({});
    expect(buildProjectFilters({ status: 'unknown' })).toEqual({});
  });

  it('includes additional raw filters', () => {
    const result = buildProjectFilters({
      companyId: '123',
      additionalFilters: { custom: 'value' },
    });
    expect(result).toEqual({ company_id: '123', custom: 'value' });
  });
});

describe('listProjects', () => {
  const mockProjects = [
    {
      id: '1',
      type: 'projects' as const,
      attributes: {
        name: 'Test Project',
        archived: false,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    },
  ];

  it('calls API with default pagination', async () => {
    const getProjects = vi.fn().mockResolvedValue({ data: mockProjects, meta: {} });
    const ctx = createTestExecutorContext({ api: { getProjects } });

    const result = await listProjects({}, ctx);

    expect(getProjects).toHaveBeenCalledWith({
      page: 1,
      perPage: 100,
      filter: {},
      sort: undefined,
    });
    expect(result.data).toEqual(mockProjects);
  });

  it('resolves filters with type mapping', async () => {
    const getProjects = vi.fn().mockResolvedValue({ data: [], meta: {} });
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { company_id: '999' },
      metadata: {
        company_id: { query: 'Acme', id: '999', label: 'Acme Corp', type: 'company' },
      },
    });

    const ctx = createTestExecutorContext({
      api: { getProjects },
      resolver: { resolveFilters },
    });

    const result = await listProjects({ companyId: 'Acme' }, ctx);

    expect(resolveFilters).toHaveBeenCalledWith({ company_id: 'Acme' });
    expect(result.resolved).toBeDefined();
  });
});
