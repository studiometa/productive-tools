import { describe, it, expect } from 'vitest';

import { extractField, formatExtractedValue } from './extract-field.js';

describe('extractField', () => {
  const testData = {
    id: '123',
    attributes: {
      title: 'Test Task',
      number: 42,
      worked_time: null,
      is_completed: false,
    },
    relationships: {
      project: {
        data: {
          id: '456',
          type: 'projects',
        },
      },
      assignee: {
        data: null,
      },
    },
    array_field: [1, 2, 3],
    nested: {
      deep: {
        value: 'found',
      },
    },
  };

  it('extracts top-level string field', () => {
    expect(extractField(testData, 'id')).toBe('123');
  });

  it('extracts nested attribute field', () => {
    expect(extractField(testData, 'attributes.title')).toBe('Test Task');
  });

  it('extracts nested number field', () => {
    expect(extractField(testData, 'attributes.number')).toBe(42);
  });

  it('extracts nested boolean field', () => {
    expect(extractField(testData, 'attributes.is_completed')).toBe(false);
  });

  it('extracts null field', () => {
    expect(extractField(testData, 'attributes.worked_time')).toBe(null);
  });

  it('extracts deeply nested relationship field', () => {
    expect(extractField(testData, 'relationships.project.data.id')).toBe('456');
  });

  it('extracts deeply nested field', () => {
    expect(extractField(testData, 'nested.deep.value')).toBe('found');
  });

  it('extracts array field', () => {
    expect(extractField(testData, 'array_field')).toEqual([1, 2, 3]);
  });

  it('returns undefined for non-existent field', () => {
    expect(extractField(testData, 'nonexistent')).toBe(undefined);
  });

  it('returns undefined for non-existent nested field', () => {
    expect(extractField(testData, 'attributes.nonexistent')).toBe(undefined);
  });

  it('returns undefined for field on null relationship', () => {
    expect(extractField(testData, 'relationships.assignee.data.id')).toBe(undefined);
  });

  it('returns undefined for empty field path', () => {
    expect(extractField(testData, '')).toBe(undefined);
  });

  it('handles null data', () => {
    expect(extractField(null, 'id')).toBe(undefined);
  });

  it('handles undefined data', () => {
    expect(extractField(undefined, 'id')).toBe(undefined);
  });

  it('handles non-object data', () => {
    expect(extractField('string', 'property')).toBe(undefined);
    expect(extractField(123, 'property')).toBe(undefined);
  });
});

describe('formatExtractedValue', () => {
  it('formats string values', () => {
    expect(formatExtractedValue('hello')).toBe('hello');
  });

  it('formats number values', () => {
    expect(formatExtractedValue(42)).toBe('42');
  });

  it('formats boolean values', () => {
    expect(formatExtractedValue(true)).toBe('true');
    expect(formatExtractedValue(false)).toBe('false');
  });

  it('formats null as null', () => {
    expect(formatExtractedValue(null)).toBe('null');
  });

  it('formats undefined as empty string', () => {
    expect(formatExtractedValue(undefined)).toBe('');
  });

  it('formats arrays as JSON', () => {
    expect(formatExtractedValue([1, 2, 3])).toBe('[1,2,3]');
  });

  it('formats objects as JSON', () => {
    expect(formatExtractedValue({ id: '123', name: 'test' })).toBe('{"id":"123","name":"test"}');
  });
});
