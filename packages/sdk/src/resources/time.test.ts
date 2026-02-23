import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncPaginatedIterator } from '../pagination.js';
import { createMockFetch } from '../test-utils.js';
import { TimeCollection } from './time.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeEntry(id: string, time: number) {
  return {
    id,
    type: 'time_entries',
    attributes: { date: '2024-01-15', time, created_at: '2024-01-01', updated_at: '2024-01-01' },
    relationships: {},
  };
}

describe('TimeCollection', () => {
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
    it('calls getTimeEntries and resolves includes', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeEntry('1', 60), makeEntry('2', 120)],
          meta: { total: 2 },
        })),
      );

      const col = new TimeCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'time_entries', time: 60 });
    });
  });

  describe('get()', () => {
    it('calls getTimeEntry and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeEntry('5', 90) })),
      );

      const col = new TimeCollection(createApi());
      const result = await col.get('5');
      expect(result.data).toMatchObject({ id: '5', time: 90 });
    });
  });

  describe('create()', () => {
    it('calls createTimeEntry and resolves the created resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeEntry('99', 30) })),
      );

      const col = new TimeCollection(createApi());
      const result = await col.create({
        person_id: 'person-1',
        service_id: 'service-1',
        date: '2024-01-15',
        time: 30,
      });
      expect(result.data).toMatchObject({ id: '99', time: 30 });
    });
  });

  describe('update()', () => {
    it('calls updateTimeEntry and resolves the updated resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeEntry('5', 45) })),
      );

      const col = new TimeCollection(createApi());
      const result = await col.update('5', { time: 45 });
      expect(result.data).toMatchObject({ id: '5', time: 45 });
    });
  });

  describe('delete()', () => {
    it('calls deleteTimeEntry', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => null),
      );

      const col = new TimeCollection(createApi());
      // Should not throw
      await expect(col.delete('5')).resolves.toBeUndefined();
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new TimeCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makeEntry('1', 60)] : [makeEntry('2', 90)],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new TimeCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });
});
