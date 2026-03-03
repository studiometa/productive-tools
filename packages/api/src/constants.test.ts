import { describe, expect, it } from 'vitest';

import {
  createStatusMap,
  createNumericStatusMap,
  COMPANY_STATUS,
  CUSTOM_FIELD_DATA_TYPE,
  DEAL_BUDGET_STATUS,
  DEAL_STATUS,
  DEAL_TYPE,
  DISCUSSION_STATUS,
  PERSON_STATUS,
  PERSON_TYPE,
  PROJECT_STATUS,
  PROJECT_TYPE,
  SERVICE_BILLING_TYPE,
  SERVICE_BUDGET_STATUS,
  TASK_OVERDUE_STATUS,
  TASK_STATUS,
  TIME_BILLING_TYPE,
  TIME_INVOICING_STATUS,
  TIME_STATUS,
} from './constants.js';

describe('createStatusMap', () => {
  const STATUS = createStatusMap({ OPEN: '1', CLOSED: '2', LOST: '3' } as const);

  it('provides forward lookup via property access', () => {
    expect(STATUS.OPEN).toBe('1');
    expect(STATUS.CLOSED).toBe('2');
    expect(STATUS.LOST).toBe('3');
  });

  it('provides reverse lookup via fromValue()', () => {
    expect(STATUS.fromValue('1')).toBe('open');
    expect(STATUS.fromValue('2')).toBe('closed');
    expect(STATUS.fromValue('3')).toBe('lost');
  });

  it('returns the original value when fromValue() finds no match', () => {
    expect(STATUS.fromValue('99')).toBe('99');
  });

  it('provides label-to-value via toValue()', () => {
    expect(STATUS.toValue('open')).toBe('1');
    expect(STATUS.toValue('closed')).toBe('2');
    expect(STATUS.toValue('lost')).toBe('3');
  });

  it('handles case-insensitive labels in toValue()', () => {
    expect(STATUS.toValue('OPEN')).toBe('1');
    expect(STATUS.toValue('Open')).toBe('1');
    expect(STATUS.toValue('Closed')).toBe('2');
  });

  it('returns the original label when toValue() finds no match', () => {
    expect(STATUS.toValue('unknown')).toBe('unknown');
  });

  it('provides entries() as [label, value] pairs', () => {
    expect(STATUS.entries()).toEqual([
      ['open', '1'],
      ['closed', '2'],
      ['lost', '3'],
    ]);
  });

  it('returns a copy from entries() (not a mutable reference)', () => {
    const a = STATUS.entries();
    const b = STATUS.entries();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});

describe('createNumericStatusMap', () => {
  const DATA_TYPE = createNumericStatusMap({
    TEXT: 1,
    NUMBER: 2,
    SELECT: 3,
    MULTI_SELECT: 5,
  } as const);

  it('provides forward lookup via property access', () => {
    expect(DATA_TYPE.TEXT).toBe(1);
    expect(DATA_TYPE.NUMBER).toBe(2);
    expect(DATA_TYPE.SELECT).toBe(3);
    expect(DATA_TYPE.MULTI_SELECT).toBe(5);
  });

  it('provides reverse lookup via fromValue()', () => {
    expect(DATA_TYPE.fromValue(1)).toBe('text');
    expect(DATA_TYPE.fromValue(2)).toBe('number');
    expect(DATA_TYPE.fromValue(3)).toBe('select');
    expect(DATA_TYPE.fromValue(5)).toBe('multi-select');
  });

  it('returns stringified value when fromValue() finds no match', () => {
    expect(DATA_TYPE.fromValue(99)).toBe('99');
  });

  it('provides label-to-value via toValue()', () => {
    expect(DATA_TYPE.toValue('text')).toBe(1);
    expect(DATA_TYPE.toValue('number')).toBe(2);
    expect(DATA_TYPE.toValue('select')).toBe(3);
    expect(DATA_TYPE.toValue('multi-select')).toBe(5);
  });

  it('handles case-insensitive labels in toValue()', () => {
    expect(DATA_TYPE.toValue('TEXT')).toBe(1);
    expect(DATA_TYPE.toValue('Text')).toBe(1);
    expect(DATA_TYPE.toValue('Select')).toBe(3);
    expect(DATA_TYPE.toValue('MULTI_SELECT')).toBe(5);
  });

  it('returns the original label when toValue() finds no match', () => {
    expect(DATA_TYPE.toValue('unknown')).toBe('unknown');
  });

  it('provides entries() as [label, value] pairs', () => {
    expect(DATA_TYPE.entries()).toEqual([
      ['text', 1],
      ['number', 2],
      ['select', 3],
      ['multi-select', 5],
    ]);
  });

  it('returns a copy from entries() (not a mutable reference)', () => {
    const a = DATA_TYPE.entries();
    const b = DATA_TYPE.entries();
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });
});

describe('resource constants', () => {
  it.each([
    ['TASK_STATUS', TASK_STATUS, { OPEN: '1', CLOSED: '2' }],
    ['TASK_OVERDUE_STATUS', TASK_OVERDUE_STATUS, { NOT_OVERDUE: '1', OVERDUE: '2' }],
    ['PROJECT_STATUS', PROJECT_STATUS, { ACTIVE: '1', ARCHIVED: '2' }],
    ['PROJECT_TYPE', PROJECT_TYPE, { INTERNAL: '1', CLIENT: '2' }],
    ['DEAL_STATUS', DEAL_STATUS, { OPEN: '1', WON: '2', LOST: '3' }],
    ['DEAL_TYPE', DEAL_TYPE, { DEAL: '1', BUDGET: '2' }],
    ['DEAL_BUDGET_STATUS', DEAL_BUDGET_STATUS, { OPEN: '1', CLOSED: '2' }],
    ['TIME_STATUS', TIME_STATUS, { APPROVED: '1', UNAPPROVED: '2', REJECTED: '3' }],
    ['TIME_BILLING_TYPE', TIME_BILLING_TYPE, { FIXED: '1', ACTUALS: '2', NON_BILLABLE: '3' }],
    [
      'TIME_INVOICING_STATUS',
      TIME_INVOICING_STATUS,
      { NOT_INVOICED: '1', DRAFTED: '2', FINALIZED: '3' },
    ],
    ['PERSON_STATUS', PERSON_STATUS, { ACTIVE: '1', DEACTIVATED: '2' }],
    ['PERSON_TYPE', PERSON_TYPE, { USER: '1', CONTACT: '2', PLACEHOLDER: '3' }],
    ['COMPANY_STATUS', COMPANY_STATUS, { ACTIVE: '1', ARCHIVED: '2' }],
    ['DISCUSSION_STATUS', DISCUSSION_STATUS, { ACTIVE: '1', RESOLVED: '2' }],
    ['SERVICE_BUDGET_STATUS', SERVICE_BUDGET_STATUS, { OPEN: '1', DELIVERED: '2' }],
    ['SERVICE_BILLING_TYPE', SERVICE_BILLING_TYPE, { FIXED: '1', ACTUALS: '2', NONE: '3' }],
  ])('%s has correct forward values', (_name, constant, expected) => {
    for (const [key, value] of Object.entries(expected)) {
      expect((constant as Record<string, string>)[key]).toBe(value);
    }
  });

  it.each([
    ['TASK_STATUS', TASK_STATUS, { '1': 'open', '2': 'closed' }],
    ['PROJECT_STATUS', PROJECT_STATUS, { '1': 'active', '2': 'archived' }],
    ['DEAL_STATUS', DEAL_STATUS, { '1': 'open', '2': 'won', '3': 'lost' }],
    ['TIME_STATUS', TIME_STATUS, { '1': 'approved', '2': 'unapproved', '3': 'rejected' }],
    ['PERSON_TYPE', PERSON_TYPE, { '1': 'user', '2': 'contact', '3': 'placeholder' }],
  ])('%s has correct reverse values via fromValue()', (_name, constant, expected) => {
    for (const [value, label] of Object.entries(expected)) {
      expect(constant.fromValue(value)).toBe(label);
    }
  });

  it.each([
    ['TASK_STATUS', TASK_STATUS, 2],
    ['DEAL_STATUS', DEAL_STATUS, 3],
    ['TIME_STATUS', TIME_STATUS, 3],
    ['PERSON_TYPE', PERSON_TYPE, 3],
    ['COMPANY_STATUS', COMPANY_STATUS, 2],
    ['SERVICE_BILLING_TYPE', SERVICE_BILLING_TYPE, 3],
  ])('%s has correct entries() count', (_name, constant, count) => {
    expect(constant.entries()).toHaveLength(count);
  });
});

describe('CUSTOM_FIELD_DATA_TYPE', () => {
  it('has correct forward values', () => {
    expect(CUSTOM_FIELD_DATA_TYPE.TEXT).toBe(1);
    expect(CUSTOM_FIELD_DATA_TYPE.NUMBER).toBe(2);
    expect(CUSTOM_FIELD_DATA_TYPE.SELECT).toBe(3);
    expect(CUSTOM_FIELD_DATA_TYPE.DATE).toBe(4);
    expect(CUSTOM_FIELD_DATA_TYPE.MULTI_SELECT).toBe(5);
    expect(CUSTOM_FIELD_DATA_TYPE.PERSON).toBe(6);
    expect(CUSTOM_FIELD_DATA_TYPE.ATTACHMENT).toBe(7);
  });

  it('has correct reverse values via fromValue()', () => {
    expect(CUSTOM_FIELD_DATA_TYPE.fromValue(1)).toBe('text');
    expect(CUSTOM_FIELD_DATA_TYPE.fromValue(3)).toBe('select');
    expect(CUSTOM_FIELD_DATA_TYPE.fromValue(5)).toBe('multi-select');
    expect(CUSTOM_FIELD_DATA_TYPE.fromValue(7)).toBe('attachment');
  });

  it('has correct entries() count', () => {
    expect(CUSTOM_FIELD_DATA_TYPE.entries()).toHaveLength(7);
  });
});
