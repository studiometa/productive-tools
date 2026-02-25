import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { ServicesCollection } from './services.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeService(id: string, name: string) {
  return {
    id,
    type: 'services',
    attributes: { name, created_at: '2024-01-01', updated_at: '2024-01-01' },
    relationships: {},
  };
}

describe('ServicesCollection', () => {
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
    it('calls getServices and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeService('1', 'Design'), makeService('2', 'Development')],
          meta: { total: 2 },
        })),
      );

      const col = new ServicesCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'services', name: 'Design' });
    });

    it('passes filter and pagination options', async () => {
      const col = new ServicesCollection(createApi());
      const result = await col.list({ page: 1, perPage: 10, filter: { project_id: '5' } });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new ServicesCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data:
              callCount === 1 ? [makeService('1', 'Design')] : [makeService('2', 'Development')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new ServicesCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new ServicesCollection(createApi());
      const builder = col.where({ project_id: '5' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new ServicesCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeService('1', 'Design')],
          meta: { total: 1 },
        })),
      );
      const col = new ServicesCollection(createApi());
      const result = await col.where({ project_id: '5' }).list();
      expect(result.data).toHaveLength(1);
    });
  });
});
