import { describe, expect, it } from 'vitest';

import {
  apiEndpointCount,
  buildApiReadQuery,
  describeApiEndpoint,
  normalizeApiPath,
  resolveApiEndpoint,
  searchApiEndpoints,
  serializeFilter,
  validateFilterSpec,
  validateSort,
} from './api-utils.js';

describe('api-utils', () => {
  it('normalizes /api/v2 paths', () => {
    expect(normalizeApiPath('/api/v2/invoices')).toBe('/invoices');
  });

  it('rejects absolute urls', () => {
    expect(() => normalizeApiPath('https://example.com')).toThrow('must start with');
    expect(() => normalizeApiPath('//example.com')).toThrow('Absolute URLs');
  });

  it('rejects traversal paths', () => {
    expect(() => normalizeApiPath('/../invoices')).toThrow('traversal');
    expect(() => normalizeApiPath('/%2e%2e/invoices')).toThrow('traversal');
  });

  it('resolves templated endpoints', () => {
    const resolved = resolveApiEndpoint('/tasks/123', 'PATCH');
    expect(resolved.spec.path).toBe('/tasks/{id}');
    expect(resolved.normalizedPath).toBe('/tasks/123');
  });

  it('serializes nested filters', () => {
    expect(
      serializeFilter({
        sent_status: { eq: 2 },
        $op: 'and',
        0: { amount_unpaid: { not_eq: 0 } },
      }),
    ).toEqual({
      'filter[sent_status][eq]': '2',
      'filter[$op]': 'and',
      'filter[0][amount_unpaid][not_eq]': '0',
    });
  });

  it('builds read query params', () => {
    expect(
      buildApiReadQuery({
        filter: { company_id: '123' },
        include: ['company'],
        sort: ['-sent_on'],
        page: 2,
        per_page: 100,
      }),
    ).toEqual({
      'filter[company_id]': '123',
      include: 'company',
      sort: '-sent_on',
      'page[number]': '2',
      'page[size]': '100',
    });
  });

  it('validates filters and operators', () => {
    const { methodSpec } = resolveApiEndpoint('/invoices', 'GET');
    expect(() => validateFilterSpec({ sent_status: { eq: 2 } }, methodSpec)).not.toThrow();
    expect(() => validateFilterSpec({ nope: 'x' }, methodSpec)).toThrow('Invalid filter field');
    expect(() => validateFilterSpec({ sent_status: { bogus: 2 } }, methodSpec)).toThrow(
      'Invalid operator',
    );
  });

  it('validates nested logical-group filters recursively', () => {
    const { methodSpec } = resolveApiEndpoint('/invoices', 'GET');

    expect(() =>
      validateFilterSpec(
        {
          $op: 'and',
          0: { sent_status: { eq: 2 } },
          1: { amount_unpaid: { not_eq: 0 } },
        },
        methodSpec,
      ),
    ).not.toThrow();

    expect(() =>
      validateFilterSpec(
        {
          $op: 'and',
          0: { nope: 'x' },
        },
        methodSpec,
      ),
    ).toThrow('Invalid filter field');

    expect(() =>
      validateFilterSpec(
        {
          $op: 'and',
          0: { sent_status: { bogus: 2 } },
        },
        methodSpec,
      ),
    ).toThrow('Invalid operator');
  });

  it('validates sort values', () => {
    const { methodSpec } = resolveApiEndpoint('/invoices', 'GET');
    expect(() => validateSort(['-sent_on'], methodSpec)).not.toThrow();
    expect(() => validateSort(['-nope'], methodSpec)).toThrow('Invalid sort field');
  });

  it('describes endpoints with richer metadata and examples', () => {
    const description = describeApiEndpoint('/reports/invoice_reports');

    expect(description).toMatchObject({
      path: '/reports/invoice_reports',
      normalized_path: '/reports/invoice_reports',
    });

    const method = (description.methods as Array<Record<string, unknown>>)[0];
    expect(method).toMatchObject({
      method: 'GET',
      summary: 'Get invoice reports',
      description: 'Retrieve aggregated invoice report data grouped by configurable dimensions.',
      operation_id: 'reports-invoice_reports-index',
      supports_body: false,
    });
    expect(method.query).toHaveProperty('sort');
    expect(method.query).toHaveProperty('group');
    expect(method.filters).toHaveProperty('company_id');
    expect(method.filters).toHaveProperty('created_at');
    expect(method.filter_operators).toHaveProperty('company_id');
    expect((method.filter_operators as Record<string, string[]>)['company_id']).toEqual(
      expect.arrayContaining(['contains', 'eq', 'not_contain', 'not_eq']),
    );
    expect(method.sort).toEqual(expect.arrayContaining(['created_at', '-created_at']));
    expect(method.example).toMatchObject({
      path: '/reports/invoice_reports',
    });
    expect(method.example).toHaveProperty('filter');
    expect(method.example).toHaveProperty('sort');
  });

  it('describes write endpoints with request body fields and examples', () => {
    const description = describeApiEndpoint('/tasks/123');
    const patchMethod = (description.methods as Array<Record<string, unknown>>).find(
      (method) => method.method === 'PATCH',
    );

    expect(patchMethod).toMatchObject({
      method: 'PATCH',
      summary: 'Update a task',
      supports_body: true,
    });
    expect(patchMethod?.request_body_fields).toEqual(
      expect.arrayContaining(['title', 'assignee_id', 'task_list_id']),
    );
    expect(patchMethod?.example).toMatchObject({
      path: '/tasks/{id}',
      method: 'PATCH',
    });
    expect(patchMethod).toBeDefined();
    expect((patchMethod as Record<string, unknown>).example).toBeTruthy();
    expect((patchMethod as { example: Record<string, unknown> }).example.body).toBeTruthy();
  });
});

describe('apiEndpointCount', () => {
  it('counts the documented endpoints', () => {
    expect(apiEndpointCount()).toBeGreaterThan(0);
  });
});

describe('searchApiEndpoints', () => {
  it('finds endpoints by path keyword', () => {
    const result = searchApiEndpoints('tasks');
    expect(result.total).toBeGreaterThan(0);
    expect(result.matches.some((m) => m.path.includes('task'))).toBe(true);
    expect(result.matches[0].methods.length).toBeGreaterThan(0);
  });

  it('returns zero matches for a nonsense query', () => {
    const result = searchApiEndpoints('zzqqxx-nope');
    expect(result.total).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it('caps results and flags truncation', () => {
    // Every endpoint path contains "/", so this matches the whole catalog.
    const result = searchApiEndpoints('/', 5);
    expect(result.matches).toHaveLength(5);
    expect(result.total).toBeGreaterThan(5);
    expect(result.truncated).toBe(true);
  });
});
