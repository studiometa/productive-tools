import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { TimersCollection } from './timers.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeTimer(id: string, totalTime: number) {
  return {
    id,
    type: 'timers',
    attributes: {
      person_id: 1,
      started_at: '2024-01-15T09:00:00Z',
      total_time: totalTime,
    },
    relationships: {},
  };
}

describe('TimersCollection', () => {
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
    it('calls getTimers and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeTimer('1', 3600), makeTimer('2', 7200)],
          meta: { total: 2 },
        })),
      );

      const col = new TimersCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'timers', total_time: 3600 });
    });
  });

  describe('get()', () => {
    it('calls getTimer and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeTimer('42', 1800) })),
      );

      const col = new TimersCollection(createApi());
      const result = await col.get('42');
      expect(result.data).toMatchObject({ id: '42', total_time: 1800 });
    });

    it('wraps 404 into ResourceNotFoundError', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(JSON.stringify({ errors: [{ detail: 'Not found' }] }), {
              status: 404,
              statusText: 'Not Found',
              headers: { 'Content-Type': 'application/vnd.api+json' },
            }),
        ),
      );

      const col = new TimersCollection(createApi());
      await expect(col.get('9999')).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new TimersCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makeTimer('1', 3600)] : [makeTimer('2', 7200)],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new TimersCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new TimersCollection(createApi());
      const builder = col.where({ person_id: '7' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new TimersCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeTimer('1', 3600)],
          meta: { total: 1 },
        })),
      );
      const col = new TimersCollection(createApi());
      const result = await col.where({ person_id: '7' }).list();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('start() / stop() (Finding 5)', () => {
    it('start() posts to /timers and resolves the timer', async () => {
      const mockFetch = createMockFetch(() => ({ data: makeTimer('1', 0) }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new TimersCollection(createApi());
      const result = await col.start({ service_id: '5' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/timers'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result.data).toMatchObject({ id: '1', type: 'timers' });
    });

    it('stop() patches /timers/:id/stop', async () => {
      const mockFetch = createMockFetch(() => ({ data: makeTimer('1', 3600) }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new TimersCollection(createApi());
      const result = await col.stop('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/timers/1/stop'),
        expect.objectContaining({ method: 'PATCH' }),
      );
      expect(result.data).toMatchObject({ id: '1' });
    });
  });
});
