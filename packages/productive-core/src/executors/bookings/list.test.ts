import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { buildBookingFilters, listBookings } from './list.js';

describe('buildBookingFilters', () => {
  it('maps typed options to API filter names', () => {
    const filters = buildBookingFilters({
      personId: '100',
      projectId: '200',
      companyId: '300',
      serviceId: '400',
      eventId: '500',
      after: '2026-01-01',
      before: '2026-01-31',
    });
    expect(filters).toEqual({
      person_id: '100',
      project_id: '200',
      company_id: '300',
      service_id: '400',
      event_id: '500',
      after: '2026-01-01',
      before: '2026-01-31',
      with_draft: 'true',
    });
  });

  it('always includes with_draft by default', () => {
    const filters = buildBookingFilters({});
    expect(filters.with_draft).toBe('true');
  });

  it('filters by draft status', () => {
    const draftFilters = buildBookingFilters({ draft: true });
    expect(draftFilters.draft).toBe('true');

    const confirmedFilters = buildBookingFilters({ draft: false });
    expect(confirmedFilters.draft).toBe('false');
  });

  it('does not add draft filter when undefined', () => {
    const filters = buildBookingFilters({});
    expect(filters.draft).toBeUndefined();
  });

  it('merges additionalFilters', () => {
    const filters = buildBookingFilters({
      personId: '100',
      additionalFilters: { booking_type: 'event' },
    });
    expect(filters.person_id).toBe('100');
    expect(filters.booking_type).toBe('event');
  });
});

describe('listBookings', () => {
  const mockResponse = {
    data: [
      {
        id: '1',
        type: 'bookings',
        attributes: { started_on: '2026-01-15', ended_on: '2026-01-16' },
      },
    ],
    meta: { current_page: 1, total_pages: 1 },
    included: [],
  };

  it('passes include and sort to API', async () => {
    const getBookings = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getBookings } });

    await listBookings(
      { include: ['person', 'service'], sort: 'started_on', page: 1, perPage: 50 },
      ctx,
    );

    expect(getBookings).toHaveBeenCalledWith(
      expect.objectContaining({
        include: ['person', 'service'],
        sort: 'started_on',
        page: 1,
        perPage: 50,
      }),
    );
  });

  it('returns resolved metadata when resolver resolves filters', async () => {
    const getBookings = vi.fn().mockResolvedValue(mockResponse);
    const resolveFilters = vi.fn().mockResolvedValue({
      resolved: { person_id: '100', with_draft: 'true' },
      metadata: { person_id: { original: 'John', resolved: '100', type: 'person' } },
    });
    const ctx = createTestExecutorContext({
      api: { getBookings },
      resolver: { resolveFilters },
    });

    const result = await listBookings({ personId: 'John' }, ctx);

    expect(result.resolved).toBeDefined();
  });

  it('builds correct filter from typed options', async () => {
    const getBookings = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getBookings } });

    await listBookings({ personId: '100', after: '2026-01-01' }, ctx);

    const callArgs = getBookings.mock.calls[0][0];
    expect(callArgs.filter.person_id).toBe('100');
    expect(callArgs.filter.after).toBe('2026-01-01');
    expect(callArgs.filter.with_draft).toBe('true');
  });
});
