import type { ProductiveApiMeta } from '@studiometa/productive-api';

import { DEFAULT_PAGE_SIZE } from '@studiometa/productive-api';

/**
 * Re-exported from `@studiometa/productive-api` (the single cross-package
 * source of truth) so SDK consumers can keep importing it from here.
 */
export { DEFAULT_PAGE_SIZE };

/**
 * Function that fetches a page of results.
 */
export type PageFetcher<T> = (page: number) => Promise<{ data: T[]; meta?: ProductiveApiMeta }>;

/**
 * Async paginated iterator that auto-fetches all pages.
 */
export class AsyncPaginatedIterator<T> {
  private fetchPage: PageFetcher<T>;
  private perPage: number;

  constructor(fetchPage: PageFetcher<T>, perPage = DEFAULT_PAGE_SIZE) {
    this.fetchPage = fetchPage;
    this.perPage = perPage;
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T, void, undefined> {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.fetchPage(page);

      for (const item of result.data) {
        yield item;
      }

      // Determine if there are more pages
      const totalPages = result.meta?.total_pages;
      if (totalPages !== undefined) {
        hasMore = page < totalPages;
      } else {
        // If no total_pages, check if we got a full page
        hasMore = result.data.length >= this.perPage;
      }

      page++;
    }
  }

  /**
   * Collect all items into an array.
   */
  async toArray(): Promise<T[]> {
    const items: T[] = [];
    for await (const item of this) {
      items.push(item);
    }
    return items;
  }
}
