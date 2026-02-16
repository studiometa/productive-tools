import type { ProductiveApi } from '@studiometa/productive-api';

import { describe, it, expect, vi } from 'vitest';

import {
  createResourceResolver,
  detectResourceType,
  FILTER_TYPE_MAPPING,
  isNumericId,
  needsResolution,
  resolve,
  resolveFilterIds,
  resolveFilterValue,
  ResolveError,
} from '../resource-resolver.js';

// ============================================================================
// Helpers
// ============================================================================

function mockApi(overrides: Partial<ProductiveApi> = {}): ProductiveApi {
  return new Proxy(overrides as ProductiveApi, {
    get(target, prop) {
      if (prop in target) return target[prop as keyof ProductiveApi];
      return vi.fn().mockResolvedValue({ data: [], meta: {} });
    },
  });
}

const mockPerson = (id: string, first: string, last: string, email = '') => ({
  id,
  type: 'people',
  attributes: { first_name: first, last_name: last, email },
  relationships: {},
});

const mockProject = (id: string, name: string, number = '') => ({
  id,
  type: 'projects',
  attributes: { name, project_number: number },
  relationships: {},
});

const mockDeal = (id: string, name: string) => ({
  id,
  type: 'deals',
  attributes: { name },
  relationships: {},
});

const mockCompany = (id: string, name: string) => ({
  id,
  type: 'companies',
  attributes: { name },
  relationships: {},
});

const mockService = (id: string, name: string) => ({
  id,
  type: 'services',
  attributes: { name },
  relationships: {},
});

// ============================================================================
// isNumericId
// ============================================================================

describe('isNumericId', () => {
  it('returns true for numeric strings', () => {
    expect(isNumericId('12345')).toBe(true);
    expect(isNumericId('0')).toBe(true);
  });

  it('returns false for non-numeric strings', () => {
    expect(isNumericId('abc')).toBe(false);
    expect(isNumericId('user@test.com')).toBe(false);
    expect(isNumericId('PRJ-123')).toBe(false);
    expect(isNumericId('')).toBe(false);
  });
});

// ============================================================================
// detectResourceType
// ============================================================================

describe('detectResourceType', () => {
  it('detects person from email', () => {
    const result = detectResourceType('user@example.com');
    expect(result).toEqual({ type: 'person', confidence: 'high', pattern: 'email' });
  });

  it('detects project from PRJ-xxx', () => {
    expect(detectResourceType('PRJ-123')?.type).toBe('project');
    expect(detectResourceType('P-456')?.type).toBe('project');
  });

  it('detects deal from D-xxx', () => {
    expect(detectResourceType('D-123')?.type).toBe('deal');
    expect(detectResourceType('DEAL-456')?.type).toBe('deal');
  });

  it('returns null for numeric IDs', () => {
    expect(detectResourceType('12345')).toBeNull();
  });

  it('returns null for unrecognized patterns', () => {
    expect(detectResourceType('something')).toBeNull();
  });
});

// ============================================================================
// resolve
// ============================================================================

describe('resolve', () => {
  it('returns numeric IDs as-is', async () => {
    const api = mockApi();
    const results = await resolve(api, '12345');
    expect(results).toEqual([
      { id: '12345', type: 'project', label: '12345', query: '12345', exact: true },
    ]);
  });

  it('resolves person by email', async () => {
    const api = mockApi({
      getPeople: vi.fn().mockResolvedValue({
        data: [mockPerson('100', 'John', 'Doe', 'john@test.com')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'john@test.com');
    expect(results).toEqual([
      { id: '100', type: 'person', label: 'John Doe', query: 'john@test.com', exact: true },
    ]);
  });

  it('resolves person by name', async () => {
    const api = mockApi({
      getPeople: vi.fn().mockResolvedValue({
        data: [mockPerson('100', 'John', 'Doe'), mockPerson('101', 'John', 'Smith')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'John', { type: 'person' });
    expect(results).toHaveLength(2);
    expect(results[0].label).toBe('John Doe');
  });

  it('resolves project by number', async () => {
    const api = mockApi({
      getProjects: vi.fn().mockResolvedValue({
        data: [mockProject('200', 'My Project', 'PRJ-001')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'PRJ-001');
    expect(results).toEqual([
      { id: '200', type: 'project', label: 'My Project', query: 'PRJ-001', exact: true },
    ]);
  });

  it('resolves project by P- prefix', async () => {
    const api = mockApi({
      getProjects: vi.fn().mockResolvedValue({
        data: [mockProject('200', 'My Project', 'PRJ-001')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'P-001');
    expect(results[0].id).toBe('200');
  });

  it('resolves project by name', async () => {
    const api = mockApi({
      getProjects: vi.fn().mockResolvedValue({
        data: [mockProject('200', 'My Project')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'My Project', { type: 'project' });
    expect(results[0].label).toBe('My Project');
    expect(results[0].exact).toBe(false);
  });

  it('resolves company by name', async () => {
    const api = mockApi({
      getCompanies: vi.fn().mockResolvedValue({
        data: [mockCompany('300', 'Acme Corp')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'Acme', { type: 'company' });
    expect(results[0]).toEqual({
      id: '300',
      type: 'company',
      label: 'Acme Corp',
      query: 'Acme',
      exact: false,
    });
  });

  it('resolves deal by number', async () => {
    const api = mockApi({
      getDeals: vi.fn().mockResolvedValue({
        data: [mockDeal('400', 'Big Deal')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'D-123');
    expect(results[0].id).toBe('400');
  });

  it('resolves deal by DEAL- prefix', async () => {
    const api = mockApi({
      getDeals: vi.fn().mockResolvedValue({
        data: [mockDeal('400', 'Big Deal')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'DEAL-123');
    expect(results[0].id).toBe('400');
  });

  it('resolves service by name', async () => {
    const api = mockApi({
      getServices: vi.fn().mockResolvedValue({
        data: [mockService('500', 'Development'), mockService('501', 'Design')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'Development', { type: 'service' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('500');
    expect(results[0].exact).toBe(true);
  });

  it('resolves service by partial name', async () => {
    const api = mockApi({
      getServices: vi.fn().mockResolvedValue({
        data: [mockService('500', 'Development'), mockService('501', 'Dev Ops')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'dev', { type: 'service' });
    expect(results).toHaveLength(2);
  });

  it('resolves service with project context', async () => {
    const getServices = vi.fn().mockResolvedValue({
      data: [mockService('500', 'Development')],
      meta: {},
    });
    const api = mockApi({ getServices });

    await resolve(api, 'dev', { type: 'service', projectId: '999' });
    expect(getServices).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { project_id: '999' },
      }),
    );
  });

  it('returns first match when requested', async () => {
    const api = mockApi({
      getPeople: vi.fn().mockResolvedValue({
        data: [mockPerson('100', 'John', 'Doe'), mockPerson('101', 'John', 'Smith')],
        meta: {},
      }),
    });

    const results = await resolve(api, 'John', { type: 'person', first: true });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('100');
  });

  it('throws ResolveError when no matches found', async () => {
    const api = mockApi({
      getPeople: vi.fn().mockResolvedValue({ data: [], meta: {} }),
    });

    await expect(resolve(api, 'nobody@test.com')).rejects.toThrow(ResolveError);
  });

  it('throws ResolveError when type cannot be determined', async () => {
    const api = mockApi();
    await expect(resolve(api, 'ambiguous-query')).rejects.toThrow(ResolveError);
  });

  it('falls back to alt request for project number', async () => {
    const api = mockApi({
      getProjects: vi
        .fn()
        .mockResolvedValueOnce({ data: [], meta: {} })
        .mockResolvedValueOnce({
          data: [mockProject('200', 'Alt Project')],
          meta: {},
        }),
    });

    const results = await resolve(api, 'PRJ-999');
    expect(results[0].label).toBe('Alt Project');
  });

  it('falls back to alt request for deal number', async () => {
    const api = mockApi({
      getDeals: vi
        .fn()
        .mockResolvedValueOnce({ data: [], meta: {} })
        .mockResolvedValueOnce({
          data: [mockDeal('400', 'Alt Deal')],
          meta: {},
        }),
    });

    const results = await resolve(api, 'D-999');
    expect(results[0].label).toBe('Alt Deal');
  });
});

// ============================================================================
// createResourceResolver
// ============================================================================

describe('createResourceResolver', () => {
  describe('resolveValue', () => {
    it('returns numeric IDs unchanged', async () => {
      const api = mockApi();
      const resolver = createResourceResolver(api);
      const result = await resolver.resolveValue('12345', 'person');
      expect(result).toBe('12345');
    });

    it('resolves non-numeric values', async () => {
      const api = mockApi({
        getPeople: vi.fn().mockResolvedValue({
          data: [mockPerson('100', 'John', 'Doe', 'john@test.com')],
          meta: {},
        }),
      });

      const resolver = createResourceResolver(api);
      const result = await resolver.resolveValue('john@test.com', 'person');
      expect(result).toBe('100');
    });

    it('uses cache when available', async () => {
      const api = mockApi();
      const cache = {
        get: vi.fn().mockResolvedValue({
          id: '100',
          type: 'person',
          label: 'Cached',
          query: 'john@test.com',
          exact: true,
        }),
        set: vi.fn().mockResolvedValue(undefined),
      };

      const resolver = createResourceResolver(api, { cache, orgId: 'org1' });
      const result = await resolver.resolveValue('john@test.com', 'person');
      expect(result).toBe('100');
      expect(cache.get).toHaveBeenCalled();
    });

    it('populates cache after resolve', async () => {
      const api = mockApi({
        getPeople: vi.fn().mockResolvedValue({
          data: [mockPerson('100', 'John', 'Doe', 'john@test.com')],
          meta: {},
        }),
      });
      const cache = {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(undefined),
      };

      const resolver = createResourceResolver(api, { cache, orgId: 'org1' });
      await resolver.resolveValue('john@test.com', 'person');
      expect(cache.set).toHaveBeenCalled();
    });
  });

  describe('resolveFilters', () => {
    it('resolves known filter types', async () => {
      const api = mockApi({
        getPeople: vi.fn().mockResolvedValue({
          data: [mockPerson('100', 'John', 'Doe', 'john@test.com')],
          meta: {},
        }),
      });

      const resolver = createResourceResolver(api);
      const { resolved, metadata } = await resolver.resolveFilters({
        person_id: 'john@test.com',
      });

      expect(resolved.person_id).toBe('100');
      expect(metadata.person_id).toEqual({
        query: 'john@test.com',
        id: '100',
        label: 'John Doe',
        type: 'person',
      });
    });

    it('passes through numeric IDs', async () => {
      const api = mockApi();
      const resolver = createResourceResolver(api);
      const { resolved } = await resolver.resolveFilters({
        person_id: '12345',
      });
      expect(resolved.person_id).toBe('12345');
    });

    it('passes through unknown filter keys', async () => {
      const api = mockApi();
      const resolver = createResourceResolver(api);
      const { resolved } = await resolver.resolveFilters({
        unknown_filter: 'some-value',
      });
      expect(resolved.unknown_filter).toBe('some-value');
    });

    it('keeps original value on resolve error', async () => {
      const api = mockApi({
        getPeople: vi.fn().mockResolvedValue({ data: [], meta: {} }),
      });

      const resolver = createResourceResolver(api);
      const { resolved } = await resolver.resolveFilters({
        person_id: 'nobody@test.com',
      });
      expect(resolved.person_id).toBe('nobody@test.com');
    });

    it('uses custom type mapping', async () => {
      const api = mockApi({
        getProjects: vi.fn().mockResolvedValue({
          data: [mockProject('200', 'My Project')],
          meta: {},
        }),
      });

      const resolver = createResourceResolver(api);
      const { resolved } = await resolver.resolveFilters(
        { custom_project: 'My Project' },
        { custom_project: 'project' },
      );
      expect(resolved.custom_project).toBe('200');
    });
  });
});

// ============================================================================
// FILTER_TYPE_MAPPING
// ============================================================================

describe('FILTER_TYPE_MAPPING', () => {
  it('maps person-related filters', () => {
    expect(FILTER_TYPE_MAPPING.person_id).toBe('person');
    expect(FILTER_TYPE_MAPPING.assignee_id).toBe('person');
    expect(FILTER_TYPE_MAPPING.creator_id).toBe('person');
    expect(FILTER_TYPE_MAPPING.responsible_id).toBe('person');
  });

  it('maps other resource filters', () => {
    expect(FILTER_TYPE_MAPPING.project_id).toBe('project');
    expect(FILTER_TYPE_MAPPING.company_id).toBe('company');
    expect(FILTER_TYPE_MAPPING.deal_id).toBe('deal');
    expect(FILTER_TYPE_MAPPING.service_id).toBe('service');
  });
});

// ============================================================================
// needsResolution
// ============================================================================

describe('needsResolution', () => {
  it('returns false for numeric IDs', () => {
    expect(needsResolution('12345')).toBe(false);
    expect(needsResolution('0')).toBe(false);
  });

  it('returns true for non-numeric values', () => {
    expect(needsResolution('user@test.com')).toBe(true);
    expect(needsResolution('PRJ-123')).toBe(true);
    expect(needsResolution('some name')).toBe(true);
  });
});

// ============================================================================
// resolveFilterValue
// ============================================================================

describe('resolveFilterValue', () => {
  it('returns numeric IDs unchanged', async () => {
    const api = mockApi();
    const result = await resolveFilterValue(api, '12345', 'person');
    expect(result).toBe('12345');
  });

  it('resolves non-numeric values', async () => {
    const api = mockApi({
      getPeople: vi.fn().mockResolvedValue({
        data: [mockPerson('100', 'John', 'Doe', 'john@test.com')],
        meta: {},
      }),
    });

    const result = await resolveFilterValue(api, 'john@test.com', 'person');
    expect(result).toBe('100');
  });

  it('throws ResolveError when no match found', async () => {
    const api = mockApi({
      getPeople: vi.fn().mockResolvedValue({ data: [], meta: {} }),
    });

    await expect(resolveFilterValue(api, 'nobody@test.com', 'person')).rejects.toThrow(
      ResolveError,
    );
  });
});

// ============================================================================
// resolveFilterIds
// ============================================================================

describe('resolveFilterIds', () => {
  it('resolves mapped filter values', async () => {
    const api = mockApi({
      getPeople: vi.fn().mockResolvedValue({
        data: [mockPerson('100', 'John', 'Doe', 'john@test.com')],
        meta: {},
      }),
    });

    const { resolved, metadata } = await resolveFilterIds(
      api,
      { person_id: 'john@test.com', status: 'active' },
      { person_id: 'person' },
    );

    expect(resolved.person_id).toBe('100');
    expect(resolved.status).toBe('active');
    expect(metadata.person_id).toEqual({
      input: 'john@test.com',
      id: '100',
      label: 'John Doe',
      reusable: true,
    });
  });

  it('passes through numeric IDs', async () => {
    const api = mockApi();
    const { resolved, metadata } = await resolveFilterIds(
      api,
      { person_id: '12345' },
      { person_id: 'person' },
    );

    expect(resolved.person_id).toBe('12345');
    expect(metadata).toEqual({});
  });

  it('passes through unmapped filter keys', async () => {
    const api = mockApi();
    const { resolved } = await resolveFilterIds(
      api,
      { unknown_key: 'some-value' },
      { person_id: 'person' },
    );

    expect(resolved.unknown_key).toBe('some-value');
  });

  it('keeps original value on resolve error', async () => {
    const api = mockApi({
      getPeople: vi.fn().mockResolvedValue({ data: [], meta: {} }),
    });

    const { resolved } = await resolveFilterIds(
      api,
      { person_id: 'nobody@test.com' },
      { person_id: 'person' },
    );

    expect(resolved.person_id).toBe('nobody@test.com');
  });
});

// ============================================================================
// ResolveError
// ============================================================================

describe('ResolveError', () => {
  it('serializes to JSON with suggestions', () => {
    const suggestions = [
      { id: '1', type: 'person' as const, label: 'John', query: 'jo', exact: false },
    ];
    const error = new ResolveError('Not found', 'jo', 'person', suggestions);
    expect(error.toJSON()).toEqual({
      error: 'ResolveError',
      message: 'Not found',
      query: 'jo',
      type: 'person',
      suggestions,
    });
  });

  it('serializes to JSON without suggestions', () => {
    const error = new ResolveError('Not found', 'jo');
    const json = error.toJSON();
    expect(json.suggestions).toBeUndefined();
    expect(json.type).toBeUndefined();
  });
});
