import { describe, it, expect } from 'vitest';

import type { JsonApiMeta } from '../types.js';

import { formatPagination, hasMorePages } from '../index.js';

describe('pagination', () => {
  describe('formatPagination', () => {
    it('should return undefined for undefined meta', () => {
      expect(formatPagination(undefined)).toBeUndefined();
    });

    it('should return undefined for single page results', () => {
      const meta: JsonApiMeta = {
        current_page: 1,
        total_pages: 1,
        total_count: 10,
        page_size: 100,
      };

      expect(formatPagination(meta)).toBeUndefined();
    });

    it('should return undefined when total_count is less than page_size', () => {
      const meta: JsonApiMeta = {
        current_page: 1,
        total_count: 50,
        page_size: 100,
      };

      expect(formatPagination(meta)).toBeUndefined();
    });

    it('should return pagination for multiple pages', () => {
      const meta: JsonApiMeta = {
        current_page: 1,
        total_pages: 5,
        total_count: 500,
        page_size: 100,
      };

      const result = formatPagination(meta);

      expect(result).toEqual({
        page: 1,
        total_pages: 5,
        total_count: 500,
      });
    });

    it('should handle alternative field names (page, total, per_page)', () => {
      const meta: JsonApiMeta = {
        page: 2,
        total: 300,
        per_page: 50,
      };

      const result = formatPagination(meta);

      expect(result).toEqual({
        page: 2,
        total_pages: 6,
        total_count: 300,
      });
    });

    it('should calculate total_pages from total_count and page_size', () => {
      const meta: JsonApiMeta = {
        current_page: 1,
        total_count: 250,
        page_size: 100,
      };

      const result = formatPagination(meta);

      expect(result).toEqual({
        page: 1,
        total_pages: 3,
        total_count: 250,
      });
    });

    it('should use defaults when fields are missing', () => {
      const meta: JsonApiMeta = {
        total_count: 500,
      };

      const result = formatPagination(meta);

      expect(result).toEqual({
        page: 1,
        total_pages: 5,
        total_count: 500,
      });
    });

    it('should prefer current_page over page', () => {
      const meta: JsonApiMeta = {
        current_page: 3,
        page: 1,
        total_pages: 10,
        total_count: 1000,
      };

      const result = formatPagination(meta);

      expect(result?.page).toBe(3);
    });
  });

  describe('hasMorePages', () => {
    it('should return false for undefined meta', () => {
      expect(hasMorePages(undefined)).toBe(false);
    });

    it('should return false on last page', () => {
      const meta: JsonApiMeta = {
        current_page: 5,
        total_pages: 5,
        total_count: 500,
        page_size: 100,
      };

      expect(hasMorePages(meta)).toBe(false);
    });

    it('should return true when not on last page', () => {
      const meta: JsonApiMeta = {
        current_page: 3,
        total_pages: 5,
        total_count: 500,
        page_size: 100,
      };

      expect(hasMorePages(meta)).toBe(true);
    });

    it('should return false for single page results', () => {
      const meta: JsonApiMeta = {
        current_page: 1,
        total_pages: 1,
        total_count: 50,
        page_size: 100,
      };

      expect(hasMorePages(meta)).toBe(false);
    });

    it('should calculate total_pages from total_count if not provided', () => {
      const meta: JsonApiMeta = {
        current_page: 1,
        total_count: 500,
        page_size: 100,
      };

      expect(hasMorePages(meta)).toBe(true);
    });

    it('should handle alternative field names', () => {
      const meta: JsonApiMeta = {
        page: 2,
        total: 500,
        per_page: 100,
      };

      expect(hasMorePages(meta)).toBe(true);
    });

    it('should return true on first page with more pages', () => {
      const meta: JsonApiMeta = {
        current_page: 1,
        total_pages: 10,
      };

      expect(hasMorePages(meta)).toBe(true);
    });
  });
});
