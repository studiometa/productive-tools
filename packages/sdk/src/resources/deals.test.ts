import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RateLimitError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { DealsCollection } from './deals.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeDeal(id: string, name: string) {
  return {
    id,
    type: 'deals',
    attributes: { name, date: '2024-01-01', created_at: '2024-01-01', updated_at: '2024-01-01' },
    relationships: {},
  };
}

describe('DealsCollection', () => {
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
    it('calls getDeals and resolves includes', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeDeal('1', 'Deal Alpha'), makeDeal('2', 'Deal Beta')],
          meta: { total: 2 },
        })),
      );

      const col = new DealsCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'deals', name: 'Deal Alpha' });
    });

    it('forwards include option', async () => {
      const mockFetch = createMockFetch(() => ({ data: [] }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new DealsCollection(createApi());
      await col.list({ include: ['company'] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include=company'),
        expect.any(Object),
      );
    });
  });

  describe('get()', () => {
    it('calls getDeal and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeDeal('10', 'Big Deal') })),
      );

      const col = new DealsCollection(createApi());
      const result = await col.get('10');
      expect(result.data).toMatchObject({ id: '10', name: 'Big Deal' });
    });

    it('forwards include option', async () => {
      const mockFetch = createMockFetch(() => ({ data: makeDeal('10', 'Deal') }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new DealsCollection(createApi());
      await col.get('10', { include: ['company', 'responsible'] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include=company%2Cresponsible'),
        expect.any(Object),
      );
    });
  });

  describe('create()', () => {
    it('calls createDeal and resolves the created resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeDeal('99', 'New Deal') })),
      );

      const col = new DealsCollection(createApi());
      const result = await col.create({ name: 'New Deal', company_id: 'company-1' });
      expect(result.data).toMatchObject({ id: '99', name: 'New Deal' });
    });
  });

  describe('update()', () => {
    it('calls updateDeal and resolves the updated resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeDeal('10', 'Updated Deal') })),
      );

      const col = new DealsCollection(createApi());
      const result = await col.update('10', { name: 'Updated Deal' });
      expect(result.data).toMatchObject({ id: '10', name: 'Updated Deal' });
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new DealsCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makeDeal('1', 'Deal A')] : [makeDeal('2', 'Deal B')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new DealsCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('error wrapping', () => {
    it('wraps 429 into RateLimitError', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response('Rate limit exceeded', {
              status: 429,
              statusText: 'Too Many Requests',
              headers: { 'Content-Type': 'text/plain' },
            }),
        ),
      );

      const col = new DealsCollection(createApi());
      await expect(col.list()).rejects.toBeInstanceOf(RateLimitError);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new DealsCollection(createApi());
      const builder = col.where({ company_id: '5' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new DealsCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeDeal('1', 'Deal Alpha')],
          meta: { total: 1 },
        })),
      );
      const col = new DealsCollection(createApi());
      const result = await col.where({ company_id: '5' }).orderBy('-date').list();
      expect(result.data).toHaveLength(1);
    });
  });
});
