import type { IncludedResource, RelationshipData } from '@studiometa/productive-api';

import { describe, expect, it } from 'vitest';

import { resolveResource, resolveListResponse, resolveSingleResponse } from './json-api.js';

type SimpleResource = {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, RelationshipData>;
};

function buildIncludedMap(included: IncludedResource[]): Map<string, IncludedResource> {
  const map = new Map<string, IncludedResource>();
  for (const resource of included) {
    map.set(`${resource.type}:${resource.id}`, resource);
  }
  return map;
}

describe('resolveResource', () => {
  it('resolves simple attributes', () => {
    const resource: SimpleResource = {
      id: '1',
      type: 'projects',
      attributes: { name: 'My Project', archived: false },
    };
    const result = resolveResource(resource, new Map());
    expect(result).toEqual({
      id: '1',
      type: 'projects',
      name: 'My Project',
      archived: false,
    });
  });

  it('inlines relationships that exist in included', () => {
    const resource: SimpleResource = {
      id: '10',
      type: 'tasks',
      attributes: { title: 'Task 1' },
      relationships: {
        project: { data: { type: 'projects', id: '1' } },
      },
    };
    const included: IncludedResource[] = [
      {
        id: '1',
        type: 'projects',
        attributes: { name: 'My Project' },
      },
    ];
    const result = resolveResource(resource, buildIncludedMap(included));
    expect(result.project).toEqual({ id: '1', type: 'projects', name: 'My Project' });
    expect(result.title).toBe('Task 1');
  });

  it('returns null for relationship with null data', () => {
    const resource: SimpleResource = {
      id: '10',
      type: 'tasks',
      attributes: { title: 'Task 1' },
      relationships: {
        assignee: { data: null },
      },
    };
    const result = resolveResource(resource, new Map());
    expect(result.assignee).toBeNull();
  });

  it('returns null for relationship missing from included', () => {
    const resource: SimpleResource = {
      id: '10',
      type: 'tasks',
      attributes: { title: 'Task 1' },
      relationships: {
        project: { data: { type: 'projects', id: '999' } },
      },
    };
    const result = resolveResource(resource, new Map());
    expect(result.project).toBeNull();
  });

  it('handles resource with no relationships', () => {
    const resource: SimpleResource = {
      id: '5',
      type: 'companies',
      attributes: { name: 'Acme Corp' },
    };
    const result = resolveResource(resource, new Map());
    expect(result).toEqual({ id: '5', type: 'companies', name: 'Acme Corp' });
  });

  it('handles relationship with no data field (meta-only)', () => {
    const resource: SimpleResource = {
      id: '10',
      type: 'tasks',
      attributes: { title: 'Task 1' },
      relationships: {
        project: { meta: { included: false } },
      },
    };
    const result = resolveResource(resource, new Map());
    expect(result.project).toBeNull();
  });
});

describe('resolveListResponse', () => {
  it('resolves multiple items with shared includes', () => {
    const included: IncludedResource[] = [
      { id: '1', type: 'companies', attributes: { name: 'Acme' } },
    ];
    const response = {
      data: [
        {
          id: '10',
          type: 'projects',
          attributes: { name: 'Project A' },
          relationships: { company: { data: { type: 'companies', id: '1' } } },
        },
        {
          id: '11',
          type: 'projects',
          attributes: { name: 'Project B' },
          relationships: { company: { data: { type: 'companies', id: '1' } } },
        },
      ],
      meta: { total: 2, total_pages: 1 },
      included,
    };
    const result = resolveListResponse(response);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Project A');
    expect(result.data[0].company).toEqual({ id: '1', type: 'companies', name: 'Acme' });
    expect(result.data[1].company).toEqual({ id: '1', type: 'companies', name: 'Acme' });
    expect(result.meta).toEqual({ total: 2, total_pages: 1 });
  });

  it('handles empty data array', () => {
    const response = { data: [], meta: { total: 0 } };
    const result = resolveListResponse(response);
    expect(result.data).toEqual([]);
  });

  it('handles response without included', () => {
    const response = {
      data: [{ id: '1', type: 'projects', attributes: { name: 'Project A' } }],
    };
    const result = resolveListResponse(response);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Project A');
  });
});

describe('resolveSingleResponse', () => {
  it('resolves a single resource with includes', () => {
    const included: IncludedResource[] = [
      { id: '5', type: 'companies', attributes: { name: 'Acme' } },
    ];
    const response = {
      data: {
        id: '1',
        type: 'deals',
        attributes: { name: 'Big Deal' },
        relationships: { company: { data: { type: 'companies', id: '5' } } },
      },
      meta: { total: 1 },
      included,
    };
    const result = resolveSingleResponse(response);
    expect(result.data.name).toBe('Big Deal');
    expect(result.data.company).toEqual({ id: '5', type: 'companies', name: 'Acme' });
    expect(result.meta).toEqual({ total: 1 });
  });

  it('resolves a single resource without includes', () => {
    const response = {
      data: {
        id: '1',
        type: 'projects',
        attributes: { name: 'Solo Project', archived: false },
      },
    };
    const result = resolveSingleResponse(response);
    expect(result.data).toEqual({
      id: '1',
      type: 'projects',
      name: 'Solo Project',
      archived: false,
    });
    expect(result.meta).toBeUndefined();
  });
});
