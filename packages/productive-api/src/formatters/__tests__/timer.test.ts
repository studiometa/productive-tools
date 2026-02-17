import { describe, it, expect } from 'vitest';

import { formatTimer } from '../timer.js';

describe('formatTimer', () => {
  it('formats running timer', () => {
    const r = formatTimer({
      id: '1',
      type: 'timers',
      attributes: {
        person_id: 100,
        started_at: '2024-01-01T10:00:00Z',
        stopped_at: null,
        total_time: 3600,
      },
      relationships: { time_entry: { data: { type: 'time_entries', id: '50' } } },
    });
    expect(r.id).toBe('1');
    expect(r.person_id).toBe(100);
    expect(r.started_at).toBe('2024-01-01T10:00:00Z');
    expect(r.stopped_at).toBeNull();
    expect(r.running).toBe(true);
    expect(r.total_time).toBe(3600);
    expect(r.time_entry_id).toBe('50');
  });

  it('formats stopped timer', () => {
    const r = formatTimer({
      id: '2',
      type: 'timers',
      attributes: {
        person_id: 100,
        started_at: '2024-01-01T10:00:00Z',
        stopped_at: '2024-01-01T12:00:00Z',
        total_time: 7200,
      },
    });
    expect(r.running).toBe(false);
    expect(r.stopped_at).toBe('2024-01-01T12:00:00Z');
  });

  it('excludes relationship IDs when disabled', () => {
    const r = formatTimer(
      {
        id: '3',
        type: 'timers',
        attributes: {},
        relationships: { time_entry: { data: { type: 'time_entries', id: '50' } } },
      },
      { includeRelationshipIds: false },
    );
    expect(r.time_entry_id).toBeUndefined();
  });

  it('handles missing attributes', () => {
    const r = formatTimer({ id: '4', type: 'timers', attributes: {} });
    expect(r.started_at).toBe('');
    expect(r.total_time).toBe(0);
    expect(r.running).toBe(true); // no stopped_at = running
  });
});
