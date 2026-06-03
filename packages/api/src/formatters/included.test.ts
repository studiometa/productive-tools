import { describe, expect, it } from 'vitest';

import type { JsonApiResource } from './types.js';

import { applyIncluded, getIncludedResource, resolveRelationships } from './included.js';

const included: JsonApiResource[] = [
  { id: '99', type: 'companies', attributes: { name: 'Acme Inc.' } },
  { id: '5', type: 'people', attributes: { first_name: 'Jane', last_name: 'Doe' } },
  { id: '7', type: 'contact_entries', attributes: { email: 'a@b.com' } },
  { id: '8', type: 'contact_entries', attributes: { email: 'c@d.com' } },
];

describe('getIncludedResource', () => {
  it('finds a sideloaded resource by type and id', () => {
    expect(getIncludedResource(included, 'companies', '99')).toMatchObject({ id: '99' });
  });

  it('returns undefined when not found or when args are missing', () => {
    expect(getIncludedResource(included, 'companies', '1')).toBeUndefined();
    expect(getIncludedResource(included, 'companies', undefined)).toBeUndefined();
    expect(getIncludedResource(included, undefined, '99')).toBeUndefined();
    expect(getIncludedResource(undefined, 'companies', '99')).toBeUndefined();
  });

  it('indexes the included array once and reuses it across lookups', () => {
    let typeReads = 0;
    const probe = included.map(
      (resource) =>
        new Proxy(resource, {
          get(target, prop, receiver) {
            if (prop === 'type') typeReads += 1;
            return Reflect.get(target, prop, receiver);
          },
        }) as JsonApiResource,
    );

    // Three lookups against the same `included` reference must build the
    // type/id index a single time — reading each entry's `type` exactly once —
    // instead of re-scanning the array linearly on every lookup.
    getIncludedResource(probe, 'people', '5');
    getIncludedResource(probe, 'contact_entries', '8');
    getIncludedResource(probe, 'companies', '99');

    expect(typeReads).toBe(probe.length);
  });

  it('keeps the first match when included has duplicate type/id entries', () => {
    const dupes: JsonApiResource[] = [
      { id: '1', type: 'companies', attributes: { name: 'First' } },
      { id: '1', type: 'companies', attributes: { name: 'Second' } },
    ];
    expect(getIncludedResource(dupes, 'companies', '1')).toMatchObject({
      attributes: { name: 'First' },
    });
  });
});

describe('resolveRelationships', () => {
  it('inlines a to-one relationship that has a match in included', () => {
    const resource: JsonApiResource = {
      id: '1',
      type: 'projects',
      attributes: { name: 'P' },
      relationships: { company: { data: { type: 'companies', id: '99' } } },
    };

    expect(resolveRelationships(resource, included)).toEqual({
      company: { id: '99', type: 'companies', name: 'Acme Inc.' },
    });
  });

  it('inlines a to-many relationship as an array', () => {
    const resource = {
      id: '1',
      type: 'companies',
      attributes: { name: 'Acme' },
      relationships: {
        contacts: {
          data: [
            { type: 'contact_entries', id: '7' },
            { type: 'contact_entries', id: '8' },
          ],
        },
      },
    };

    expect(resolveRelationships(resource, included)).toEqual({
      contacts: [
        { id: '7', type: 'contact_entries', email: 'a@b.com' },
        { id: '8', type: 'contact_entries', email: 'c@d.com' },
      ],
    });
  });

  it('keeps id and type authoritative even if attributes collide', () => {
    const withCollision: JsonApiResource[] = [
      { id: '99', type: 'companies', attributes: { id: 'WRONG', type: 'WRONG', name: 'Acme' } },
    ];
    const resource: JsonApiResource = {
      id: '1',
      type: 'projects',
      attributes: {},
      relationships: { company: { data: { type: 'companies', id: '99' } } },
    };

    expect(resolveRelationships(resource, withCollision)).toEqual({
      company: { id: '99', type: 'companies', name: 'Acme' },
    });
  });

  it('skips relationships with no match, null data, or no included', () => {
    const resource: JsonApiResource = {
      id: '1',
      type: 'projects',
      attributes: {},
      relationships: {
        company: { data: { type: 'companies', id: 'missing' } },
        responsible: { data: null },
      },
    };

    expect(resolveRelationships(resource, included)).toEqual({});
    expect(resolveRelationships(resource, undefined)).toEqual({});
    expect(resolveRelationships({ id: '1', type: 'projects', attributes: {} }, included)).toEqual(
      {},
    );
  });

  it('resolves several relationships and drops array entries with no match', () => {
    const resource = {
      id: '1',
      type: 'pages',
      attributes: {},
      relationships: {
        creator: { data: { type: 'people', id: '5' } },
        contacts: {
          data: [
            { type: 'contact_entries', id: '7' },
            { type: 'contact_entries', id: 'nope' },
          ],
        },
      },
    };

    expect(resolveRelationships(resource, included)).toEqual({
      creator: { id: '5', type: 'people', first_name: 'Jane', last_name: 'Doe' },
      contacts: [{ id: '7', type: 'contact_entries', email: 'a@b.com' }],
    });
  });
});

describe('applyIncluded', () => {
  it('inlines resolved relationships onto the target in place', () => {
    const resource: JsonApiResource = {
      id: '1',
      type: 'projects',
      attributes: { name: 'P' },
      relationships: { company: { data: { type: 'companies', id: '99' } } },
    };
    const target: Record<string, unknown> = { id: '1', name: 'P' };

    applyIncluded(target, resource, included);

    expect(target.company).toMatchObject({ id: '99', type: 'companies', name: 'Acme Inc.' });
  });

  it('is a no-op when included is undefined', () => {
    const resource: JsonApiResource = {
      id: '1',
      type: 'projects',
      attributes: {},
      relationships: { company: { data: { type: 'companies', id: '99' } } },
    };
    const target: Record<string, unknown> = { id: '1' };

    applyIncluded(target, resource, undefined);

    expect(target).toEqual({ id: '1' });
  });
});
