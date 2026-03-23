import { describe, it, expect } from 'vitest';

import { formatPerson } from './person.js';

describe('formatPerson', () => {
  it('formats with all fields', () => {
    const r = formatPerson({
      id: '1',
      type: 'people',
      attributes: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        active: true,
        title: 'Developer',
        created_at: '2024-01-01',
        updated_at: '2024-06-01',
      },
    });
    expect(r).toEqual({
      id: '1',
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      active: true,
      title: 'Developer',
      created_at: '2024-01-01',
      updated_at: '2024-06-01',
    });
  });

  it('handles missing names', () => {
    const r = formatPerson({ id: '2', type: 'people', attributes: {} });
    expect(r.name).toBe('');
    expect(r.first_name).toBe('');
    expect(r.last_name).toBe('');
    expect(r.email).toBe('');
    expect(r.active).toBe(true); // defaults to true
  });

  it('excludes timestamps when disabled', () => {
    const r = formatPerson(
      { id: '3', type: 'people', attributes: { first_name: 'A', last_name: 'B', created_at: 'x' } },
      { includeTimestamps: false },
    );
    expect(r.created_at).toBeUndefined();
  });

  it('omits title when not present', () => {
    const r = formatPerson({ id: '4', type: 'people', attributes: { first_name: 'X' } });
    expect(r.title).toBeUndefined();
  });

  it('includes custom_fields when present and non-empty', () => {
    const r = formatPerson({
      id: '5',
      type: 'people',
      attributes: { first_name: 'A', custom_fields: { '100': 'value' } },
    });
    expect(r.custom_fields).toEqual({ '100': 'value' });
  });

  it('omits custom_fields when empty', () => {
    const r = formatPerson({
      id: '6',
      type: 'people',
      attributes: { first_name: 'A', custom_fields: {} },
    });
    expect(r.custom_fields).toBeUndefined();
  });

  it('omits custom_fields when null', () => {
    const r = formatPerson({
      id: '7',
      type: 'people',
      attributes: { first_name: 'A', custom_fields: null },
    });
    expect(r.custom_fields).toBeUndefined();
  });
});
