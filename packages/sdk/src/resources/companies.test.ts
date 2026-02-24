import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { CompaniesCollection } from './companies.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeCompany(id: string, name: string) {
  return {
    id,
    type: 'companies',
    attributes: { name, created_at: '2024-01-01', updated_at: '2024-01-01' },
    relationships: {},
  };
}

describe('CompaniesCollection', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      createMockFetch(() => ({ data: [], meta: {} })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('list()', () => {
    it('calls getCompanies and resolves includes', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeCompany('1', 'Acme'), makeCompany('2', 'Globex')],
          meta: { total: 2 },
        })),
      );

      const col = new CompaniesCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'companies', name: 'Acme' });
    });
  });

  describe('get()', () => {
    it('calls getCompany and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeCompany('42', 'Initech') })),
      );

      const col = new CompaniesCollection(createApi());
      const result = await col.get('42');
      expect(result.data).toMatchObject({ id: '42', name: 'Initech' });
    });
  });

  describe('create()', () => {
    it('calls createCompany and resolves the created resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeCompany('99', 'New Corp') })),
      );

      const col = new CompaniesCollection(createApi());
      const result = await col.create({ name: 'New Corp' });
      expect(result.data).toMatchObject({ id: '99', name: 'New Corp' });
    });
  });

  describe('update()', () => {
    it('calls updateCompany and resolves the updated resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeCompany('42', 'Updated Corp') })),
      );

      const col = new CompaniesCollection(createApi());
      const result = await col.update('42', { name: 'Updated Corp' });
      expect(result.data).toMatchObject({ id: '42', name: 'Updated Corp' });
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new CompaniesCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makeCompany('1', 'Acme')] : [makeCompany('2', 'Globex')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new CompaniesCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('error wrapping', () => {
    it('wraps 422 into ValidationError with parsed fieldErrors', async () => {
      const body = JSON.stringify({
        errors: [{ detail: 'is required', source: { pointer: '/data/attributes/name' } }],
      });
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(body, {
              status: 422,
              statusText: 'Unprocessable Entity',
              headers: { 'Content-Type': 'application/vnd.api+json' },
            }),
        ),
      );

      const col = new CompaniesCollection(createApi());
      const err = await col.create({ name: '' }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fieldErrors).toEqual([
        { field: 'name', message: 'is required' },
      ]);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new CompaniesCollection(createApi());
      const builder = col.where({ name: 'Acme' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new CompaniesCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeCompany('1', 'Acme')],
          meta: { total: 1 },
        })),
      );
      const col = new CompaniesCollection(createApi());
      const result = await col.where({ name: 'Acme' }).orderBy('name').list();
      expect(result.data).toHaveLength(1);
    });
  });
});
