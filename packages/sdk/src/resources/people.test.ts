import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthenticationError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { PeopleCollection } from './people.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makePerson(id: string, name: string) {
  return {
    id,
    type: 'people',
    attributes: {
      name,
      email: `${id}@example.com`,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    relationships: {},
  };
}

describe('PeopleCollection', () => {
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
    it('calls getPeople and resolves includes', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makePerson('1', 'Alice'), makePerson('2', 'Bob')],
          meta: { total: 2 },
        })),
      );

      const col = new PeopleCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'people', name: 'Alice' });
    });
  });

  describe('get()', () => {
    it('calls getPerson and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makePerson('10', 'Charlie') })),
      );

      const col = new PeopleCollection(createApi());
      const result = await col.get('10');
      expect(result.data).toMatchObject({ id: '10', name: 'Charlie' });
    });
  });

  describe('me()', () => {
    it('throws when userId is not set', async () => {
      const col = new PeopleCollection(createApi());
      await expect(col.me()).rejects.toThrow('userId must be set');
    });

    it('fetches the current user by userId', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makePerson('user-123', 'Me') })),
      );

      const col = new PeopleCollection(createApi(), 'user-123');
      const result = await col.me();
      expect(result.data).toMatchObject({ id: 'user-123', name: 'Me' });
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new PeopleCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makePerson('1', 'Alice')] : [makePerson('2', 'Bob')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new PeopleCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('error wrapping', () => {
    it('wraps 401 into AuthenticationError', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(JSON.stringify({ errors: [{ detail: 'Unauthorized' }] }), {
              status: 401,
              statusText: 'Unauthorized',
              headers: { 'Content-Type': 'application/vnd.api+json' },
            }),
        ),
      );

      const col = new PeopleCollection(createApi());
      await expect(col.get('me')).rejects.toBeInstanceOf(AuthenticationError);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new PeopleCollection(createApi());
      const builder = col.where({ email: 'alice@example.com' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new PeopleCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makePerson('1', 'Alice')],
          meta: { total: 1 },
        })),
      );
      const col = new PeopleCollection(createApi());
      const result = await col.where({ email: 'alice@example.com' }).orderBy('name').list();
      expect(result.data).toHaveLength(1);
    });
  });
});
