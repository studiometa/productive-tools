/**
 * Pagination formatting utilities
 */

import type { JsonApiMeta, FormattedPagination } from './types.js';

/**
 * Format JSON:API pagination metadata into clean output
 * Returns undefined if no meaningful pagination info (single page)
 */
export function formatPagination(meta?: JsonApiMeta): FormattedPagination | undefined {
  if (!meta) return undefined;

  const page = meta.current_page ?? meta.page ?? 1;
  const totalCount = meta.total_count ?? meta.total ?? 0;
  const pageSize = meta.page_size ?? meta.per_page ?? 100;
  const totalPages = meta.total_pages ?? (Math.ceil(totalCount / pageSize) || 1);

  // Only return pagination if there's more than one page
  if (totalPages <= 1 && totalCount <= pageSize) {
    return undefined;
  }

  return {
    page,
    total_pages: totalPages,
    total_count: totalCount,
  };
}

/**
 * Check if there are more pages available
 */
export function hasMorePages(meta?: JsonApiMeta): boolean {
  if (!meta) return false;

  const page = meta.current_page ?? meta.page ?? 1;
  const totalCount = meta.total_count ?? meta.total ?? 0;
  const pageSize = meta.page_size ?? meta.per_page ?? 100;
  const totalPages = meta.total_pages ?? (Math.ceil(totalCount / pageSize) || 1);

  return page < totalPages;
}
