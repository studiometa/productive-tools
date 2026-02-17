import { describe, it, expect } from 'vitest';

import { formatBooking } from '../booking.js';

const fullBooking = {
  id: '1',
  type: 'bookings',
  attributes: {
    started_on: '2024-01-01',
    ended_on: '2024-01-05',
    time: 480,
    total_time: 2400,
    percentage: 100,
    booking_method_id: 1,
    draft: false,
    note: 'Sprint work',
    approved_at: '2024-01-06',
    rejected_at: null,
    rejected_reason: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-06',
  },
  relationships: {
    person: { data: { type: 'people', id: '10' } },
    service: { data: { type: 'services', id: '20' } },
    event: { data: { type: 'events', id: '30' } },
  },
};

const included = [
  { id: '10', type: 'people', attributes: { first_name: 'Jane', last_name: 'Doe' } },
  { id: '20', type: 'services', attributes: { name: 'Development' } },
];

describe('formatBooking', () => {
  it('formats with all fields and includes', () => {
    const r = formatBooking(fullBooking, { included });
    expect(r.id).toBe('1');
    expect(r.started_on).toBe('2024-01-01');
    expect(r.ended_on).toBe('2024-01-05');
    expect(r.time).toBe(480);
    expect(r.total_time).toBe(2400);
    expect(r.percentage).toBe(100);
    expect(r.booking_method).toBe('per_day');
    expect(r.draft).toBe(false);
    expect(r.note).toBe('Sprint work');
    expect(r.approved_at).toBe('2024-01-06');
    expect(r.person_id).toBe('10');
    expect(r.person_name).toBe('Jane Doe');
    expect(r.service_id).toBe('20');
    expect(r.service_name).toBe('Development');
    expect(r.event_id).toBe('30');
  });

  it('maps booking method ids', () => {
    const mk = (id: number) =>
      formatBooking({
        ...fullBooking,
        attributes: { ...fullBooking.attributes, booking_method_id: id },
      });
    expect(mk(1).booking_method).toBe('per_day');
    expect(mk(2).booking_method).toBe('percentage');
    expect(mk(3).booking_method).toBe('total_hours');
    expect(mk(99).booking_method).toBe('unknown');
  });

  it('handles null optional fields', () => {
    const r = formatBooking({ id: '2', type: 'bookings', attributes: {} });
    expect(r.time).toBeNull();
    expect(r.total_time).toBeNull();
    expect(r.percentage).toBeNull();
    expect(r.note).toBeNull();
    expect(r.approved_at).toBeNull();
    expect(r.rejected_at).toBeNull();
    expect(r.rejected_reason).toBeNull();
  });

  it('excludes relationship IDs when disabled', () => {
    const r = formatBooking(fullBooking, { includeRelationshipIds: false });
    expect(r.person_id).toBeUndefined();
    expect(r.service_id).toBeUndefined();
    expect(r.event_id).toBeUndefined();
  });

  it('excludes timestamps when disabled', () => {
    const r = formatBooking(fullBooking, { includeTimestamps: false });
    expect(r.created_at).toBeUndefined();
    expect(r.updated_at).toBeUndefined();
  });

  it('handles missing included resources', () => {
    const r = formatBooking(fullBooking, { included: [] });
    expect(r.person_name).toBeUndefined();
    expect(r.service_name).toBeUndefined();
  });
});
