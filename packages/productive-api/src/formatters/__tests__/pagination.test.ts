import { describe, it, expect } from 'vitest';

import { formatPagination, hasMorePages } from '../pagination.js';

describe('formatPagination', () => {
  it('returns undefined for undefined meta', () => {
    expect(formatPagination(undefined)).toBeUndefined();
  });

  it('returns undefined for single page results', () => {
    expect(
      formatPagination({ current_page: 1, total_pages: 1, total_count: 10, page_size: 100 }),
    ).toBeUndefined();
  });

  it('returns undefined when total_count < page_size', () => {
    expect(formatPagination({ current_page: 1, total_count: 50, page_size: 100 })).toBeUndefined();
  });

  it('returns pagination for multiple pages', () => {
    expect(
      formatPagination({ current_page: 1, total_pages: 5, total_count: 500, page_size: 100 }),
    ).toEqual({ page: 1, total_pages: 5, total_count: 500 });
  });

  it('handles alternative field names (page, total, per_page)', () => {
    expect(formatPagination({ page: 2, total: 300, per_page: 50 })).toEqual({
      page: 2,
      total_pages: 6,
      total_count: 300,
    });
  });

  it('calculates total_pages from total_count and page_size', () => {
    expect(formatPagination({ current_page: 1, total_count: 250, page_size: 100 })).toEqual({
      page: 1,
      total_pages: 3,
      total_count: 250,
    });
  });

  it('uses defaults when fields are missing', () => {
    expect(formatPagination({ total_count: 500 })).toEqual({
      page: 1,
      total_pages: 5,
      total_count: 500,
    });
  });

  it('prefers current_page over page', () => {
    const r = formatPagination({ current_page: 3, page: 1, total_pages: 10, total_count: 1000 });
    expect(r?.page).toBe(3);
  });

  it('handles empty meta', () => {
    expect(formatPagination({})).toBeUndefined();
  });
});

describe('hasMorePages', () => {
  it('returns false for undefined meta', () => {
    expect(hasMorePages(undefined)).toBe(false);
  });

  it('returns false on last page', () => {
    expect(
      hasMorePages({ current_page: 5, total_pages: 5, total_count: 500, page_size: 100 }),
    ).toBe(false);
  });

  it('returns true when not on last page', () => {
    expect(
      hasMorePages({ current_page: 3, total_pages: 5, total_count: 500, page_size: 100 }),
    ).toBe(true);
  });

  it('returns false for single page', () => {
    expect(hasMorePages({ current_page: 1, total_pages: 1, total_count: 50, page_size: 100 })).toBe(
      false,
    );
  });

  it('calculates total_pages from total_count', () => {
    expect(hasMorePages({ current_page: 1, total_count: 500, page_size: 100 })).toBe(true);
  });

  it('handles alternative field names', () => {
    expect(hasMorePages({ page: 2, total: 500, per_page: 100 })).toBe(true);
  });

  it('returns true on first page with more', () => {
    expect(hasMorePages({ current_page: 1, total_pages: 10 })).toBe(true);
  });
});
