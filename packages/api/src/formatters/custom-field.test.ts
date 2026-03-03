import { describe, it, expect } from 'vitest';

import type { JsonApiResource } from './types.js';

import { formatCustomField, formatCustomFieldOption } from './custom-field.js';

const makeField = (overrides: Partial<JsonApiResource> = {}): JsonApiResource => ({
  id: '42236',
  type: 'custom_fields',
  attributes: {
    name: 'Semaine',
    data_type: 3,
    customizable_type: 'Task',
    archived: false,
    required: true,
    description: 'La semaine du sprint',
    default_value: null,
    position: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    ...overrides.attributes,
  },
  relationships: overrides.relationships,
});

const makeOption = (overrides: Partial<JsonApiResource> = {}): JsonApiResource => ({
  id: '417421',
  type: 'custom_field_options',
  attributes: {
    value: '2026-09 (23 février-01 mars)',
    position: 1,
    archived: false,
    color: '#ff0000',
    ...overrides.attributes,
  },
  relationships: {
    custom_field: { data: { type: 'custom_fields', id: '42236' } },
    ...overrides.relationships,
  },
});

describe('formatCustomField', () => {
  it('formats a basic custom field', () => {
    const result = formatCustomField(makeField());

    expect(result.id).toBe('42236');
    expect(result.name).toBe('Semaine');
    expect(result.data_type).toBe('select');
    expect(result.data_type_id).toBe(3);
    expect(result.customizable_type).toBe('Task');
    expect(result.archived).toBe(false);
    expect(result.required).toBe(true);
    expect(result.description).toBe('La semaine du sprint');
  });

  it('maps all data type IDs to names', () => {
    const types: Array<[number, string]> = [
      [1, 'text'],
      [2, 'number'],
      [3, 'select'],
      [4, 'date'],
      [5, 'multi-select'],
      [6, 'person'],
      [7, 'attachment'],
    ];

    for (const [id, name] of types) {
      const result = formatCustomField(makeField({ attributes: { data_type: id } }));
      expect(result.data_type).toBe(name);
    }
  });

  it('handles unknown data type', () => {
    const result = formatCustomField(makeField({ attributes: { data_type: 99 } }));
    expect(result.data_type).toBe('99');
  });

  it('omits description when not present', () => {
    const result = formatCustomField(makeField({ attributes: { description: undefined } }));
    expect(result.description).toBeUndefined();
  });

  it('omits default_value when null', () => {
    const result = formatCustomField(makeField());
    expect(result.default_value).toBeUndefined();
  });

  it('includes default_value when present', () => {
    const result = formatCustomField(makeField({ attributes: { default_value: 'test' } }));
    expect(result.default_value).toBe('test');
  });

  it('includes timestamps by default', () => {
    const result = formatCustomField(makeField());
    expect(result.created_at).toBe('2026-01-01T00:00:00Z');
    expect(result.updated_at).toBe('2026-01-15T00:00:00Z');
  });

  it('excludes timestamps when disabled', () => {
    const result = formatCustomField(makeField(), { includeTimestamps: false });
    expect(result.created_at).toBeUndefined();
    expect(result.updated_at).toBeUndefined();
  });

  it('resolves options from included resources', () => {
    const field = makeField();
    const option = makeOption();

    const result = formatCustomField(field, { included: [option] });

    expect(result.options).toHaveLength(1);
    expect((result.options as Array<{ value: string }>)[0].value).toBe(
      '2026-09 (23 février-01 mars)',
    );
  });

  it('does not include options when not in included', () => {
    const result = formatCustomField(makeField(), { included: [] });
    expect(result.options).toBeUndefined();
  });

  it('only includes options belonging to this field', () => {
    const field = makeField();
    const ownOption = makeOption();
    const otherOption = makeOption({
      id: '999',
      attributes: { value: 'Other' },
      relationships: {
        custom_field: { data: { type: 'custom_fields', id: '99999' } },
      },
    });

    const result = formatCustomField(field, { included: [ownOption, otherOption] });

    expect(result.options).toHaveLength(1);
  });

  it('handles missing attributes gracefully', () => {
    const field: JsonApiResource = {
      id: '1',
      type: 'custom_fields',
      attributes: {},
    };

    const result = formatCustomField(field);
    expect(result.name).toBe('');
    expect(result.data_type).toBe('0');
    expect(result.customizable_type).toBe('');
    expect(result.archived).toBe(false);
    expect(result.required).toBe(false);
  });
});

describe('formatCustomFieldOption', () => {
  it('formats a basic option', () => {
    const result = formatCustomFieldOption(makeOption());

    expect(result.id).toBe('417421');
    expect(result.value).toBe('2026-09 (23 février-01 mars)');
    expect(result.archived).toBe(false);
    expect(result.color).toBe('#ff0000');
    expect(result.position).toBe(1);
  });

  it('omits color when not present', () => {
    const result = formatCustomFieldOption(makeOption({ attributes: { color: undefined } }));
    expect(result.color).toBeUndefined();
  });

  it('omits position when not present', () => {
    const result = formatCustomFieldOption(makeOption({ attributes: { position: undefined } }));
    expect(result.position).toBeUndefined();
  });

  it('handles missing attributes gracefully', () => {
    const option: JsonApiResource = {
      id: '1',
      type: 'custom_field_options',
      attributes: {},
    };

    const result = formatCustomFieldOption(option);
    expect(result.value).toBe('');
    expect(result.archived).toBe(false);
  });
});
