import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { ActivitiesCollection } from './activities.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeActivity(id: string, event: 'create' | 'update' | 'delete' = 'create') {
  return {
    id,
    type: 'activities',
    attributes: {
      event,
      changeset: [],
      created_at: '2024-01-01',
    },
    relationships: {},
  };
}

describe('ActivitiesCollection', () => {
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
    it('calls getActivities and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeActivity('1', 'create'), makeActivity('2', 'update')],
          meta: { total: 2 },
        })),
      );

      const col = new ActivitiesCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'activities', event: 'create' });
    });

    it('passes filter and include options', async () => {
      const col = new ActivitiesCollection(createApi());
      const result = await col.list({
        filter: { subject_type: 'Task' },
        include: ['creator'],
      });
      expect(result.data).toHaveLength(0);
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new ActivitiesCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makeActivity('1', 'create')] : [makeActivity('2', 'update')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new ActivitiesCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new ActivitiesCollection(createApi());
      const builder = col.where({ subject_type: 'Task' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new ActivitiesCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeActivity('1', 'create')],
          meta: { total: 1 },
        })),
      );
      const col = new ActivitiesCollection(createApi());
      const result = await col.where({ subject_type: 'Task' }).list();
      expect(result.data).toHaveLength(1);
    });
  });
});
