import { describe, expect, it } from 'vitest';

import { formatTimeEntry } from './time-entry.js';

const mockEntry = {
  id: '456',
  type: 'time_entries',
  attributes: {
    date: '2026-01-15',
    time: 480,
    note: '<p>Development work</p>',
    billable_time: 480,
    approved: true,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  relationships: {
    person: { data: { type: 'people', id: '100' } },
    service: { data: { type: 'services', id: '200' } },
    project: { data: { type: 'projects', id: '300' } },
  },
};

describe('formatTimeEntry', () => {
  it('formats time in minutes and hours', () => {
    const result = formatTimeEntry(mockEntry);
    expect(result.time_minutes).toBe(480);
    expect(result.time_hours).toBe('8.00');
  });

  it('strips HTML from note by default', () => {
    const result = formatTimeEntry(mockEntry);
    expect(result.note).toBe('Development work');
  });

  it('preserves HTML when stripHtml is false', () => {
    const result = formatTimeEntry(mockEntry, { stripHtml: false });
    expect(result.note).toBe('<p>Development work</p>');
  });

  it('includes relationship IDs by default', () => {
    const result = formatTimeEntry(mockEntry);
    expect(result.person_id).toBe('100');
    expect(result.service_id).toBe('200');
    expect(result.project_id).toBe('300');
  });

  it('excludes relationship IDs when option is false', () => {
    const result = formatTimeEntry(mockEntry, { includeRelationshipIds: false });
    expect(result.person_id).toBeUndefined();
    expect(result.service_id).toBeUndefined();
    expect(result.project_id).toBeUndefined();
  });
});
