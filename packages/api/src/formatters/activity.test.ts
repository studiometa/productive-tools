import { describe, it, expect } from 'vitest';

import { formatActivity, formatChangeset } from './activity.js';

describe('formatChangeset', () => {
  it('formats simple primitive changes', () => {
    const cs = [{ name: [null, 'SLA Basic'] }, { price: [0, 4900] }] as Array<
      Record<string, [unknown, unknown]>
    >;
    expect(formatChangeset(cs)).toBe("name: null → 'SLA Basic', price: 0 → 4900");
  });

  it('handles empty changeset', () => {
    expect(formatChangeset([])).toBe('');
  });

  it('wraps string values in quotes', () => {
    const cs = [{ status: ['open', 'closed'] }] as Array<Record<string, [unknown, unknown]>>;
    expect(formatChangeset(cs)).toBe("status: 'open' → 'closed'");
  });

  it('handles null on both sides', () => {
    const cs = [{ note: [null, null] }] as Array<Record<string, [unknown, unknown]>>;
    expect(formatChangeset(cs)).toBe('note: null → null');
  });

  it('handles object values with value property', () => {
    const cs = [
      {
        currency: [
          { value: 'USD', id: 1 },
          { value: 'EUR', id: 2 },
        ],
      },
    ] as Array<Record<string, [unknown, unknown]>>;
    expect(formatChangeset(cs)).toBe('currency: USD → EUR');
  });

  it('handles object values with id only', () => {
    const cs = [{ project: [{ id: '100' }, { id: '200' }] }] as Array<
      Record<string, [unknown, unknown]>
    >;
    expect(formatChangeset(cs)).toBe('project: #100 → #200');
  });

  it('truncates long string values', () => {
    const longStr = 'x'.repeat(100);
    const cs = [{ name: [null, longStr] }] as Array<Record<string, [unknown, unknown]>>;
    const result = formatChangeset(cs);
    expect(result).toContain('…');
    // The output should be shorter than if we printed the full string
    expect(result.length).toBeLessThan(200);
  });
});

describe('formatActivity', () => {
  const baseActivity = {
    id: '123',
    type: 'activities',
    attributes: {
      event: 'create',
      changeset: [{ name: [null, 'SLA Basic'] }],
      created_at: '2026-02-22T10:30:00.000+01:00',
    },
    relationships: {
      creator: { data: { type: 'people', id: '42' } },
    },
  };

  it('formats basic fields', () => {
    const result = formatActivity(baseActivity);
    expect(result.id).toBe('123');
    expect(result.event).toBe('create');
    expect(result.created_at).toBe('2026-02-22T10:30:00.000+01:00');
    expect(result.changeset).toBe("name: null → 'SLA Basic'");
  });

  it('includes creator_id when includeRelationshipIds is true', () => {
    const result = formatActivity(baseActivity, { includeRelationshipIds: true });
    expect(result.creator_id).toBe('42');
  });

  it('omits creator_id when includeRelationshipIds is false', () => {
    const result = formatActivity(baseActivity, { includeRelationshipIds: false });
    expect(result.creator_id).toBeUndefined();
  });

  it('resolves creator name from included resources', () => {
    const result = formatActivity(baseActivity, {
      included: [
        {
          id: '42',
          type: 'people',
          attributes: { first_name: 'John', last_name: 'Doe' },
        },
      ],
    });
    expect(result.creator_name).toBe('John Doe');
  });

  it('handles missing creator relationship', () => {
    const activity = {
      id: '1',
      type: 'activities',
      attributes: { event: 'delete', changeset: [], created_at: '2026-01-01T00:00:00Z' },
    };
    const result = formatActivity(activity);
    expect(result.creator_id).toBeUndefined();
    expect(result.creator_name).toBeUndefined();
  });

  it('handles empty changeset', () => {
    const activity = {
      id: '1',
      type: 'activities',
      attributes: { event: 'update', changeset: [], created_at: '2026-01-01T00:00:00Z' },
    };
    const result = formatActivity(activity);
    expect(result.changeset).toBe('');
  });

  it('handles missing attributes (event, changeset, created_at)', () => {
    const activity = { id: '1', type: 'activities', attributes: {} };
    const result = formatActivity(activity);
    expect(result.event).toBe('');
    expect(result.changeset).toBe('');
    expect(result.created_at).toBe('');
  });

  it('formats changeset with object values containing id only', () => {
    const result = formatChangeset([{ project: [null, { id: 42 }] }]);
    expect(result).toContain('#42');
  });

  it('formats changeset with complex object fallback to short JSON', () => {
    const result = formatChangeset([{ meta: [null, { foo: 'bar', baz: 123 }] }]);
    expect(result).toContain('meta:');
    expect(result).toContain('foo');
  });

  it('truncates long complex object JSON in changeset', () => {
    const longObj = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`key_${i}`, `value_that_is_somewhat_long_${i}`]),
    );
    const result = formatChangeset([{ data: [null, longObj] }]);
    expect(result).toContain('…');
  });

  it('truncates long string values in changeset', () => {
    const longString = 'x'.repeat(100);
    const result = formatChangeset([{ field: [null, longString] }]);
    expect(result).toContain('…');
    expect(result.length).toBeLessThan(200);
  });

  it('formats changeset with raw string values wrapped in quotes', () => {
    const result = formatChangeset([{ name: ['old name', 'new name'] }]);
    expect(result).toContain("'old name'");
    expect(result).toContain("'new name'");
  });

  it('includes creator_id with includeRelationshipIds but no included data', () => {
    const activity = {
      id: '1',
      type: 'activities',
      attributes: { event: 'create', changeset: [], created_at: '2026-01-01T00:00:00Z' },
      relationships: { creator: { data: { type: 'people', id: '42' } } },
    };
    const result = formatActivity(activity, { includeRelationshipIds: true });
    expect(result.creator_id).toBe('42');
    expect(result.creator_name).toBeUndefined();
  });
});
