import { describe, expect, it } from 'vitest';

import type { JsonApiResource } from './types.js';

import { getIncludedResource, resolveRelationships } from './included.js';

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
