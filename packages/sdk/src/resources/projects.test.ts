import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncPaginatedIterator } from '../pagination.js';
import { createMockFetch } from '../test-utils.js';
import { ProjectsCollection } from './projects.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeProject(id: string, name: string) {
  return {
    id,
    type: 'projects',
    attributes: { name, archived: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    relationships: {},
  };
}

describe('ProjectsCollection', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      createMockFetch(() => ({ data: [], meta: { total: 0 } })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('list()', () => {
    it('calls getProjects and resolves includes', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeProject('1', 'Project Alpha'), makeProject('2', 'Project Beta')],
          meta: { total: 2, total_pages: 1 },
        })),
      );

      const col = new ProjectsCollection(createApi());
      const result = await col.list();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'projects', name: 'Project Alpha' });
      expect(result.data[1]).toMatchObject({ id: '2', type: 'projects', name: 'Project Beta' });
      expect(result.meta).toMatchObject({ total: 2 });
    });

    it('passes filters and pagination options', async () => {
      const mockFetch = createMockFetch(() => ({ data: [], meta: {} }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new ProjectsCollection(createApi());
      await col.list({ page: 2, perPage: 50, filter: { archived: 'false' } });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page%5Bnumber%5D=2'),
        expect.any(Object),
      );
    });
  });

  describe('get()', () => {
    it('calls getProject and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: makeProject('42', 'Single Project'),
          meta: {},
        })),
      );

      const col = new ProjectsCollection(createApi());
      const result = await col.get('42');

      expect(result.data).toMatchObject({ id: '42', type: 'projects', name: 'Single Project' });
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new ProjectsCollection(createApi());
      const iter = col.all();
      expect(iter).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          if (callCount === 1) {
            return {
              data: [makeProject('1', 'P1'), makeProject('2', 'P2')],
              meta: { total_pages: 2 },
            };
          }
          return {
            data: [makeProject('3', 'P3')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new ProjectsCollection(createApi());
      const results = await col.all({ perPage: 2 }).toArray();

      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({ id: '1', name: 'P1' });
      expect(results[2]).toMatchObject({ id: '3', name: 'P3' });
    });
  });
});
