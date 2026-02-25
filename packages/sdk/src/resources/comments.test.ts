import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { CommentsCollection } from './comments.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeComment(id: string, body: string) {
  return {
    id,
    type: 'comments',
    attributes: {
      body,
      commentable_type: 'Task',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    relationships: {},
  };
}

describe('CommentsCollection', () => {
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
    it('calls getComments and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeComment('1', 'Hello'), makeComment('2', 'World')],
          meta: { total: 2 },
        })),
      );

      const col = new CommentsCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'comments', body: 'Hello' });
    });
  });

  describe('get()', () => {
    it('calls getComment and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeComment('42', 'Test comment') })),
      );

      const col = new CommentsCollection(createApi());
      const result = await col.get('42');
      expect(result.data).toMatchObject({ id: '42', body: 'Test comment' });
    });
  });

  describe('create()', () => {
    it('calls createComment and resolves the created resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeComment('99', 'New comment') })),
      );

      const col = new CommentsCollection(createApi());
      const result = await col.create({ body: 'New comment', task_id: '1' });
      expect(result.data).toMatchObject({ id: '99', body: 'New comment' });
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

      const col = new CommentsCollection(createApi());
      const err = await col.create({ body: '' }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ValidationError);
    });
  });

  describe('update()', () => {
    it('calls updateComment and resolves the updated resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeComment('42', 'Updated comment') })),
      );

      const col = new CommentsCollection(createApi());
      const result = await col.update('42', { body: 'Updated comment' });
      expect(result.data).toMatchObject({ id: '42', body: 'Updated comment' });
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new CommentsCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makeComment('1', 'Hello')] : [makeComment('2', 'World')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new CommentsCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new CommentsCollection(createApi());
      const builder = col.where({ task_id: '1' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new CommentsCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeComment('1', 'Hello')],
          meta: { total: 1 },
        })),
      );
      const col = new CommentsCollection(createApi());
      const result = await col.where({ task_id: '1' }).list();
      expect(result.data).toHaveLength(1);
    });
  });
});
