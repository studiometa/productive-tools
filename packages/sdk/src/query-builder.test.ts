import { describe, expect, it, vi } from 'vitest';

import { AsyncPaginatedIterator } from './pagination.js';
import { QueryBuilder } from './query-builder.js';

function makeMockCollection() {
  return {
    list: vi.fn(async () => ({ data: [], meta: undefined })),
    all: vi.fn(() => new AsyncPaginatedIterator(async () => ({ data: [] }), 200)),
  };
}

describe('QueryBuilder', () => {
  describe('build()', () => {
    it('returns an empty object when no methods are called', () => {
      const qb = new QueryBuilder(makeMockCollection());
      expect(qb.build()).toEqual({});
    });

    it('sets filter in build output', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.filter({ project_id: '42' });
      expect(qb.build()).toEqual({ filter: { project_id: '42' } });
    });

    it('merges filters when filter() is called multiple times', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.filter({ project_id: '42' });
      qb.filter({ status: 'open' });
      expect(qb.build()).toEqual({ filter: { project_id: '42', status: 'open' } });
    });

    it('sets sort in build output', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.orderBy('-due_date');
      expect(qb.build()).toEqual({ sort: '-due_date' });
    });

    it('last orderBy() call wins', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.orderBy('due_date');
      qb.orderBy('-created_at');
      expect(qb.build()).toEqual({ sort: '-created_at' });
    });

    it('adds to include array', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.include('project');
      expect(qb.build()).toEqual({ include: ['project'] });
    });

    it('deduplicates include when called multiple times', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.include('project');
      qb.include('project');
      qb.include('assignee');
      expect(qb.build()).toEqual({ include: ['project', 'assignee'] });
    });

    it('adds multiple paths from a single include() call', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.include('a', 'b');
      expect(qb.build()).toEqual({ include: ['a', 'b'] });
    });

    it('sets page in build output', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.page(3);
      expect(qb.build()).toEqual({ page: 3 });
    });

    it('sets perPage in build output', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.perPage(50);
      expect(qb.build()).toEqual({ perPage: 50 });
    });

    it('handles full chain correctly', () => {
      const qb = new QueryBuilder(makeMockCollection());
      const result = qb.filter({ a: '1' }).orderBy('-x').include('y').page(2).perPage(50).build();
      expect(result).toEqual({
        filter: { a: '1' },
        sort: '-x',
        include: ['y'],
        page: 2,
        perPage: 50,
      });
    });

    it('returns a copy — mutating the result does not affect the builder', () => {
      const qb = new QueryBuilder(makeMockCollection());
      qb.filter({ a: '1' }).include('x');

      const result1 = qb.build();
      result1.filter!['b'] = '2';
      result1.include!.push('z');

      const result2 = qb.build();
      expect(result2.filter).toEqual({ a: '1' });
      expect(result2.include).toEqual(['x']);
    });
  });

  describe('list()', () => {
    it('calls collection.list with built options', async () => {
      const mock = makeMockCollection();
      const qb = new QueryBuilder(mock);
      await qb.filter({ project_id: '42' }).orderBy('-due_date').list();

      expect(mock.list).toHaveBeenCalledOnce();
      expect(mock.list).toHaveBeenCalledWith({
        filter: { project_id: '42' },
        sort: '-due_date',
      });
    });

    it('returns the result from collection.list', async () => {
      const mock = makeMockCollection();
      mock.list.mockResolvedValueOnce({ data: [{ id: '1' }], meta: undefined } as never);
      const qb = new QueryBuilder(mock);
      const result = await qb.list();
      expect(result).toEqual({ data: [{ id: '1' }], meta: undefined });
    });
  });

  describe('all()', () => {
    it('calls collection.all with built options (without page)', () => {
      const mock = makeMockCollection();
      const qb = new QueryBuilder(mock);
      qb.filter({ project_id: '42' }).page(3).perPage(100).all();

      expect(mock.all).toHaveBeenCalledOnce();
      // page should be stripped
      expect(mock.all).toHaveBeenCalledWith({
        filter: { project_id: '42' },
        perPage: 100,
      });
    });

    it('returns an AsyncPaginatedIterator', () => {
      const mock = makeMockCollection();
      const qb = new QueryBuilder(mock);
      const result = qb.all();
      expect(result).toBeInstanceOf(AsyncPaginatedIterator);
    });
  });

  describe('chaining returns this', () => {
    it('filter() returns the same QueryBuilder instance', () => {
      const qb = new QueryBuilder(makeMockCollection());
      expect(qb.filter({})).toBe(qb);
    });

    it('orderBy() returns the same QueryBuilder instance', () => {
      const qb = new QueryBuilder(makeMockCollection());
      expect(qb.orderBy('name')).toBe(qb);
    });

    it('include() returns the same QueryBuilder instance', () => {
      const qb = new QueryBuilder(makeMockCollection());
      expect(qb.include('project')).toBe(qb);
    });

    it('page() returns the same QueryBuilder instance', () => {
      const qb = new QueryBuilder(makeMockCollection());
      expect(qb.page(1)).toBe(qb);
    });

    it('perPage() returns the same QueryBuilder instance', () => {
      const qb = new QueryBuilder(makeMockCollection());
      expect(qb.perPage(25)).toBe(qb);
    });
  });
});
