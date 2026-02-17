import { describe, it, expect } from 'vitest';

import { formatPerson } from '../person.js';

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
});
