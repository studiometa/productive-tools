import { ProductiveApi } from '@studiometa/productive-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '../errors.js';
import { AsyncPaginatedIterator } from '../pagination.js';
import { QueryBuilder } from '../query-builder.js';
import { createMockFetch } from '../test-utils.js';
import { BookingsCollection } from './bookings.js';

const validConfig = { apiToken: 'test-token', organizationId: 'test-org' };

function createApi() {
  return new ProductiveApi({ config: validConfig, useCache: false, rateLimit: { enabled: false } });
}

function makeBooking(id: string, startedOn: string) {
  return {
    id,
    type: 'bookings',
    attributes: {
      started_on: startedOn,
      ended_on: '2024-01-31',
      booking_method_id: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    relationships: {
      person: { data: { type: 'people', id: '10' } },
    },
  };
}

describe('BookingsCollection', () => {
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
    it('calls getBookings and resolves the response', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeBooking('1', '2024-01-01'), makeBooking('2', '2024-02-01')],
          meta: { total: 2 },
        })),
      );

      const col = new BookingsCollection(createApi());
      const result = await col.list();
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: '1',
        type: 'bookings',
        started_on: '2024-01-01',
      });
    });
  });

  describe('get()', () => {
    it('calls getBooking and resolves the resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeBooking('42', '2024-03-01') })),
      );

      const col = new BookingsCollection(createApi());
      const result = await col.get('42');
      expect(result.data).toMatchObject({ id: '42', started_on: '2024-03-01' });
    });
  });

  describe('create()', () => {
    it('calls createBooking and resolves the created resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeBooking('99', '2024-04-01') })),
      );

      const col = new BookingsCollection(createApi());
      const result = await col.create({
        person_id: '10',
        started_on: '2024-04-01',
        ended_on: '2024-04-30',
      });
      expect(result.data).toMatchObject({ id: '99', started_on: '2024-04-01' });
    });

    it('wraps 422 into ValidationError', async () => {
      const body = JSON.stringify({
        errors: [{ detail: 'is required', source: { pointer: '/data/attributes/started_on' } }],
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

      const col = new BookingsCollection(createApi());
      const err = await col
        .create({ person_id: '10', started_on: '', ended_on: '' })
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ValidationError);
    });
  });

  describe('update()', () => {
    it('calls updateBooking and resolves the updated resource', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({ data: makeBooking('42', '2024-05-01') })),
      );

      const col = new BookingsCollection(createApi());
      const result = await col.update('42', { started_on: '2024-05-01' });
      expect(result.data).toMatchObject({ id: '42', started_on: '2024-05-01' });
    });
  });

  describe('all()', () => {
    it('returns an AsyncPaginatedIterator', () => {
      const col = new BookingsCollection(createApi());
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
              callCount === 1 ? [makeBooking('1', '2024-01-01')] : [makeBooking('2', '2024-02-01')],
            meta: { total_pages: 2 },
          };
        }),
      );

      const col = new BookingsCollection(createApi());
      const results = await col.all({ perPage: 1 }).toArray();
      expect(results).toHaveLength(2);
    });
  });

  describe('where()', () => {
    it('returns a QueryBuilder', () => {
      const col = new BookingsCollection(createApi());
      const builder = col.where({ person_id: '10' });
      expect(builder).toBeInstanceOf(QueryBuilder);
    });

    it('returns a QueryBuilder with no arguments', () => {
      const col = new BookingsCollection(createApi());
      expect(col.where()).toBeInstanceOf(QueryBuilder);
    });

    it('chains and executes list()', async () => {
      vi.stubGlobal(
        'fetch',
        createMockFetch(() => ({
          data: [makeBooking('1', '2024-01-01')],
          meta: { total: 1 },
        })),
      );
      const col = new BookingsCollection(createApi());
      const result = await col.where({ person_id: '10' }).list();
      expect(result.data).toHaveLength(1);
    });
  });
});
