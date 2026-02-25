import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { AttachmentsCollection } from './attachments.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeAttachment(id: string, name: string) {
  return {
    id,
    type: 'attachments',
    attributes: {
      name,
      content_type: 'image/png',
      size: 1024,
      url: `https://example.com/attachments/${id}`,
      created_at: '2024-01-01',
    },
    relationships: {},
  };
}

describe('AttachmentsCollection', () => {
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
    it('calls getAttachments and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeAttachment('1', 'screenshot.png'), makeAttachment('2', 'document.pdf')],
          meta: { total: 2 },
        })),
      );

      const col = new AttachmentsCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: '1',
        type: 'attachments',
        name: 'screenshot.png',
      });
    });
  });

  describe('get()', () => {
    it('calls getAttachment and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeAttachment('42', 'report.pdf') })),
      );

      const col = new AttachmentsCollection(createApi());
      const result = await col.get('42');
      expect(result.data).toMatchObject({ id: '42', name: 'report.pdf' });
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

      const col = new AttachmentsCollection(createApi());
      await expect(col.get('9999')).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });

  describe('delete()', () => {
    it('calls deleteAttachment', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => null),
      );

      const col = new AttachmentsCollection(createApi());
      await expect(col.delete('42')).resolves.toBeUndefined();
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new AttachmentsCollection(createApi());
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
                ? [makeAttachment('1', 'file1.png')]
                : [makeAttachment('2', 'file2.png')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new AttachmentsCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new AttachmentsCollection(createApi());
      const builder = col.where({ task_id: '5' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new AttachmentsCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeAttachment('1', 'screenshot.png')],
          meta: { total: 1 },
        })),
      );
      const col = new AttachmentsCollection(createApi());
      const result = await col.where({ task_id: '5' }).list();
      expect(result.data).toHaveLength(1);
    });
  });
});
