import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { DiscussionsCollection } from './discussions.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeDiscussion(id: string, title: string) {
  return {
    id,
    type: 'discussions',
    attributes: {
      title,
      body: 'Discussion body',
      status: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    relationships: {},
  };
}

describe('DiscussionsCollection', () => {
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
    it('calls getDiscussions and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeDiscussion('1', 'Feature request'), makeDiscussion('2', 'Bug report')],
          meta: { total: 2 },
        })),
      );

      const col = new DiscussionsCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: '1',
        type: 'discussions',
        title: 'Feature request',
      });
    });

    it('forwards the include param to the request', async () => {
      const mockFetch = createMockFetch(() => ({ data: [], meta: {} }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new DiscussionsCollection(createApi());
      await col.list({ include: ['page'] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include=page'),
        expect.any(Object),
      );
    });
  });

  describe('get()', () => {
    it('calls getDiscussion and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeDiscussion('42', 'My Discussion') })),
      );

      const col = new DiscussionsCollection(createApi());
      const result = await col.get('42');
      expect(result.data).toMatchObject({ id: '42', title: 'My Discussion' });
    });

    it('forwards the include param to the request', async () => {
      const mockFetch = createMockFetch(() => ({ data: makeDiscussion('42', 'My Discussion') }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new DiscussionsCollection(createApi());
      await col.get('42', { include: ['page'] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include=page'),
        expect.any(Object),
      );
    });
  });

  describe('create()', () => {
    it('calls createDiscussion and resolves the created resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeDiscussion('99', 'New Discussion') })),
      );

      const col = new DiscussionsCollection(createApi());
      const result = await col.create({ body: 'Body text', page_id: '1', title: 'New Discussion' });
      expect(result.data).toMatchObject({ id: '99', title: 'New Discussion' });
    });

    it('wraps 422 into ValidationError', async () => {
      const body = JSON.stringify({
        errors: [{ detail: 'is required', source: { pointer: '/data/attributes/body' } }],
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

      const col = new DiscussionsCollection(createApi());
      const err = await col.create({ body: '', page_id: '1' }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ValidationError);
    });
  });

  describe('update()', () => {
    it('calls updateDiscussion and resolves the updated resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeDiscussion('42', 'Updated Discussion') })),
      );

      const col = new DiscussionsCollection(createApi());
      const result = await col.update('42', { title: 'Updated Discussion' });
      expect(result.data).toMatchObject({ id: '42', title: 'Updated Discussion' });
    });
  });

  describe('delete()', () => {
    it('calls deleteDiscussion', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => null),
      );

      const col = new DiscussionsCollection(createApi());
      await expect(col.delete('42')).resolves.toBeUndefined();
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new DiscussionsCollection(createApi());
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
              callCount === 1 ? [makeDiscussion('1', 'First')] : [makeDiscussion('2', 'Second')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new DiscussionsCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new DiscussionsCollection(createApi());
      const builder = col.where({ page_id: '1' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new DiscussionsCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeDiscussion('1', 'Feature request')],
          meta: { total: 1 },
        })),
      );
      const col = new DiscussionsCollection(createApi());
      const result = await col.where({ page_id: '1' }).list();
      expect(result.data).toHaveLength(1);
    });
  });

  describe('resolve() / reopen() (Finding 5)', () => {
    it('resolve() patches the discussion and resolves it', async () => {
      const mockFetch = createMockFetch(() => ({ data: makeDiscussion('1', 'Done') }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new DiscussionsCollection(createApi());
      const result = await col.resolve('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/discussions/1'),
        expect.objectContaining({ method: 'PATCH' }),
      );
      expect(result.data).toMatchObject({ id: '1', type: 'discussions' });
    });

    it('reopen() patches the discussion', async () => {
      const mockFetch = createMockFetch(() => ({ data: makeDiscussion('1', 'Reopened') }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new DiscussionsCollection(createApi());
      const result = await col.reopen('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/discussions/1'),
        expect.objectContaining({ method: 'PATCH' }),
      );
      expect(result.data).toMatchObject({ id: '1' });
    });
  });
});
