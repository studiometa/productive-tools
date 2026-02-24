import type { ProductiveApi } from '@studiometa/productive-api';

import type { PageFetcher } from '../pagination.js';

import { AsyncPaginatedIterator } from '../pagination.js';

/**
 * Abstract base class for resource collections.
 * Provides common patterns for list, get, and all operations.
 */
export abstract class BaseCollection {
  protected readonly api: ProductiveApi;

  constructor(api: ProductiveApi) {
    this.api = api;
  }

  /**
   * Create an async paginated iterator for this resource.
   */
  protected createIterator<T>(fetcher: PageFetcher<T>, perPage = 200): AsyncPaginatedIterator<T> {
    return new AsyncPaginatedIterator<T>(fetcher, perPage);
  }
}
