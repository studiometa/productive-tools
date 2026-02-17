import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { parseDate, parseDateRange } from './date.js';

describe('parseDate', () => {
  beforeEach(() => {
    // Mock Date to 2024-01-15 (Monday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should parse ISO date format', () => {
    expect(parseDate('2024-01-01')).toBe('2024-01-01');
    expect(parseDate('2023-12-31')).toBe('2023-12-31');
  });

  it('should parse "today"', () => {
    expect(parseDate('today')).toBe('2024-01-15');
    expect(parseDate('Today')).toBe('2024-01-15');
    expect(parseDate('TODAY')).toBe('2024-01-15');
  });

  it('should parse "yesterday"', () => {
    expect(parseDate('yesterday')).toBe('2024-01-14');
  });

  it('should parse "tomorrow"', () => {
    expect(parseDate('tomorrow')).toBe('2024-01-16');
  });

  it('should parse relative days', () => {
    expect(parseDate('1 day ago')).toBe('2024-01-14');
    expect(parseDate('2 days ago')).toBe('2024-01-13');
    expect(parseDate('7 days ago')).toBe('2024-01-08');
  });

  it('should parse relative weeks', () => {
    expect(parseDate('1 week ago')).toBe('2024-01-08');
    expect(parseDate('2 weeks ago')).toBe('2024-01-01');
  });

  it('should parse relative months', () => {
    expect(parseDate('1 month ago')).toBe('2023-12-15');
    expect(parseDate('2 months ago')).toBe('2023-11-15');
  });

  it('should parse "last week" (start of previous week)', () => {
    // 2024-01-15 is Monday, last week Monday was 2024-01-08
    expect(parseDate('last week')).toBe('2024-01-08');
  });

  it('should parse "this week" (start of current week)', () => {
    // 2024-01-15 is already Monday
    expect(parseDate('this week')).toBe('2024-01-15');
  });

  it('should parse "last month"', () => {
    expect(parseDate('last month')).toBe('2023-12-01');
  });

  it('should parse "this month"', () => {
    expect(parseDate('this month')).toBe('2024-01-01');
  });

  it('should return null for invalid input', () => {
    expect(parseDate('')).toBeNull();
    expect(parseDate('invalid')).toBeNull();
    expect(parseDate('next week')).toBeNull();
    expect(parseDate('2024/01/01')).toBeNull();
  });
});

describe('parseDateRange', () => {
  beforeEach(() => {
    // Mock Date to 2024-01-15 (Monday)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should parse "today" as same day range', () => {
    expect(parseDateRange('today')).toEqual({
      from: '2024-01-15',
      to: '2024-01-15',
    });
  });

  it('should parse "yesterday" as same day range', () => {
    expect(parseDateRange('yesterday')).toEqual({
      from: '2024-01-14',
      to: '2024-01-14',
    });
  });

  it('should parse "this week" as Monday to Sunday', () => {
    expect(parseDateRange('this week')).toEqual({
      from: '2024-01-15',
      to: '2024-01-21',
    });
  });

  it('should parse "last week" as previous Monday to Sunday', () => {
    expect(parseDateRange('last week')).toEqual({
      from: '2024-01-08',
      to: '2024-01-14',
    });
  });

  it('should parse "this month" as first to last day', () => {
    expect(parseDateRange('this month')).toEqual({
      from: '2024-01-01',
      to: '2024-01-31',
    });
  });

  it('should parse "last month" as first to last day of previous month', () => {
    expect(parseDateRange('last month')).toEqual({
      from: '2023-12-01',
      to: '2023-12-31',
    });
  });

  it('should parse ISO date as same day range', () => {
    expect(parseDateRange('2024-02-14')).toEqual({
      from: '2024-02-14',
      to: '2024-02-14',
    });
  });

  it('should parse relative dates as same day range', () => {
    expect(parseDateRange('3 days ago')).toEqual({
      from: '2024-01-12',
      to: '2024-01-12',
    });
  });

  it('should return null for invalid input', () => {
    expect(parseDateRange('')).toBeNull();
    expect(parseDateRange('invalid')).toBeNull();
  });
});
