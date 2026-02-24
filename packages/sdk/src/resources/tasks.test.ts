import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { TasksCollection } from './tasks.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeTask(id: string, title: string) {
  return {
    id,
    type: 'tasks',
    attributes: { title, created_at: '2024-01-01', updated_at: '2024-01-01' },
    relationships: {},
  };
}

describe('TasksCollection', () => {
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
    it('calls getTasks and resolves includes', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeTask('1', 'Task Alpha'), makeTask('2', 'Task Beta')],
          meta: { total: 2, total_pages: 1 },
        })),
      );

      const col = new TasksCollection(createApi());
      const result = await col.list();

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({ id: '1', type: 'tasks', title: 'Task Alpha' });
    });
  });

  describe('get()', () => {
    it('calls getTask and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: makeTask('10', 'Single Task'),
        })),
      );

      const col = new TasksCollection(createApi());
      const result = await col.get('10');
      expect(result.data).toMatchObject({ id: '10', title: 'Single Task' });
    });

    it('forwards include option', async () => {
      const mockFetch = createMockFetch(() => ({
        data: makeTask('10', 'Task with includes'),
      }));
      vi.stubGlobal('fetch', mockFetch);

      const col = new TasksCollection(createApi());
      await col.get('10', { include: ['project', 'assignee'] });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include=project%2Cassignee'),
        expect.any(Object),
      );
    });
  });

  describe('create()', () => {
    it('calls createTask and resolves the created resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: makeTask('99', 'New Task'),
        })),
      );

      const col = new TasksCollection(createApi());
      const result = await col.create({
        title: 'New Task',
        project_id: 'proj-1',
        task_list_id: 'list-1',
      });
      expect(result.data).toMatchObject({ id: '99', title: 'New Task' });
    });
  });

  describe('update()', () => {
    it('calls updateTask and resolves the updated resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: makeTask('10', 'Updated Task'),
        })),
      );

      const col = new TasksCollection(createApi());
      const result = await col.update('10', { title: 'Updated Task' });
      expect(result.data).toMatchObject({ id: '10', title: 'Updated Task' });
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new TasksCollection(createApi());
      expect(col.all()).toBeInstanceOf(AsyncPaginatedIterator);
    });

    it('iterates through all pages', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => {
          callCount++;
          return {
            data: callCount === 1 ? [makeTask('1', 'T1')] : [makeTask('2', 'T2')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new TasksCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('error wrapping', () => {
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

      const col = new TasksCollection(createApi());
      await expect(col.get('999')).rejects.toBeInstanceOf(ResourceNotFoundError);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new TasksCollection(createApi());
      const builder = col.where({ project_id: '42' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new TasksCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeTask('1', 'T1')],
          meta: { total: 1 },
        })),
      );
      const col = new TasksCollection(createApi());
      const result = await col.where({ project_id: '42' }).orderBy('-due_date').list();
      expect(result.data).toHaveLength(1);
    });
  });
});
