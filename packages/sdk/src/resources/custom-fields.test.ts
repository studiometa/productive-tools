import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { CustomFieldsCollection } from './custom-fields.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeCustomField(id: string, name: string, dataType: number = 1) {
  return {
    id,
    type: 'custom_fields',
    attributes: {
      name,
      data_type: dataType,
      customizable_type: 'Task',
      archived: false,
      required: false,
      description: `Description for ${name}`,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    relationships: {
      options: { data: null },
    },
  };
}

describe('CustomFieldsCollection', () => {
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
    it('calls getCustomFields and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeCustomField('1', 'Priority'), makeCustomField('2', 'Sprint', 3)],
          meta: { total: 2 },
        })),
      );

      const col = new CustomFieldsCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: '1',
        type: 'custom_fields',
        name: 'Priority',
        data_type: 1,
      });
    });

    it('passes filter and include options', async () => {
      const mockFetch = createMockFetch(() => ({ data: [], meta: {} }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new CustomFieldsCollection(createApi());
      await col.list({
        filter: { customizable_type: 'Task' },
        include: ['options'],
      });

      const url = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('filter%5Bcustomizable_type%5D=Task');
      expect(url).toContain('include=options');
    });

    it('passes pagination options', async () => {
      const mockFetch = createMockFetch(() => ({ data: [], meta: {} }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new CustomFieldsCollection(createApi());
      await col.list({ page: 2, perPage: 10 });

      const url = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('page%5Bnumber%5D=2');
      expect(url).toContain('page%5Bsize%5D=10');
    });
  });

  describe('get()', () => {
    it('calls getCustomField and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: makeCustomField('42', 'Week Number', 2),
        })),
      );

      const col = new CustomFieldsCollection(createApi());
      const result = await col.get('42');
      expect(result.data).toMatchObject({
        id: '42',
        name: 'Week Number',
        data_type: 2,
        customizable_type: 'Task',
      });
    });

    it('passes include option for options', async () => {
      const mockFetch = createMockFetch(() => ({
        data: makeCustomField('42', 'Status', 3),
        included: [
          {
            id: '100',
            type: 'custom_field_options',
            attributes: { value: 'Active', archived: false },
          },
        ],
      }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new CustomFieldsCollection(createApi());
      await col.get('42', { include: ['options'] });

      const url = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('include=options');
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

      const col = new CustomFieldsCollection(createApi());
      await expect(col.get('9999')).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new CustomFieldsCollection(createApi());
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
              callCount === 1
                ? [makeCustomField('1', 'Priority')]
                : [makeCustomField('2', 'Sprint')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new CustomFieldsCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });

    it('passes filter options to paginated queries', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeCustomField('1', 'Priority')],
          meta: { total_pages: 1 },
        })),
      );

      const col = new CustomFieldsCollection(createApi());
      const results = await col
        .all({ filter: { customizable_type: 'Deal' }, perPage: 50 })
        .toArray();
      expect(results).toHaveLength(1);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new CustomFieldsCollection(createApi());
      const builder = col.where({ customizable_type: 'Task' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new CustomFieldsCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeCustomField('1', 'Sprint', 3)],
          meta: { total: 1 },
        })),
      );

      const col = new CustomFieldsCollection(createApi());
      const result = await col.where({ customizable_type: 'Task' }).list();
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ name: 'Sprint', data_type: 3 });
    });
  });
});
