import type { ProductiveApi } from '@studiometa/productive-api';

import { wrapError } from '../errors.js';

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
   * Wrap an API call, converting any thrown error into a typed ProductiveError.
   */
  protected async wrapRequest<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw wrapError(error);
    }
  }
}
