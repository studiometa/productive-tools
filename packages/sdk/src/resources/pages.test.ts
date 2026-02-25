import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { PagesCollection } from './pages.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makePage(id: string, title: string) {
  return {
    id,
    type: 'pages',
    attributes: {
      title,
      body: '<p>Page content</p>',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    relationships: {
      project: { data: { type: 'projects', id: '5' } },
    },
  };
}

describe('PagesCollection', () => {
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
    it('calls getPages and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makePage('1', 'Getting Started'), makePage('2', 'API Reference')],
          meta: { total: 2 },
        })),
      );

      const col = new PagesCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'pages', title: 'Getting Started' });
    });
  });

  describe('get()', () => {
    it('calls getPage and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makePage('42', 'My Page') })),
      );

      const col = new PagesCollection(createApi());
      const result = await col.get('42');
      expect(result.data).toMatchObject({ id: '42', title: 'My Page' });
    });
  });

  describe('create()', () => {
    it('calls createPage and resolves the created resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makePage('99', 'New Page') })),
      );

      const col = new PagesCollection(createApi());
      const result = await col.create({ title: 'New Page', project_id: '5' });
      expect(result.data).toMatchObject({ id: '99', title: 'New Page' });
    });

    it('wraps 422 into ValidationError', async () => {
      const body = JSON.stringify({
        errors: [{ detail: 'is required', source: { pointer: '/data/attributes/title' } }],
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

      const col = new PagesCollection(createApi());
      const err = await col.create({ title: '', project_id: '5' }).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ValidationError);
    });
  });

  describe('update()', () => {
    it('calls updatePage and resolves the updated resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makePage('42', 'Updated Page') })),
      );

      const col = new PagesCollection(createApi());
      const result = await col.update('42', { title: 'Updated Page' });
      expect(result.data).toMatchObject({ id: '42', title: 'Updated Page' });
    });
  });

  describe('delete()', () => {
    it('calls deletePage', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => null),
      );

      const col = new PagesCollection(createApi());
      await expect(col.delete('42')).resolves.toBeUndefined();
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new PagesCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makePage('1', 'First')] : [makePage('2', 'Second')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new PagesCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new PagesCollection(createApi());
      const builder = col.where({ project_id: '5' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new PagesCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makePage('1', 'Getting Started')],
          meta: { total: 1 },
        })),
      );
      const col = new PagesCollection(createApi());
      const result = await col.where({ project_id: '5' }).list();
      expect(result.data).toHaveLength(1);
    });
  });
});
