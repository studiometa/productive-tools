/**
 * CLI-specific ProductiveApi that auto-reads config and injects cache.
 *
 * Extends the base ProductiveApi from @studiometa/productive-api
 * with CLI concerns: config file reading, keychain, SQLite cache.
 */

import { ProductiveApi as BaseProductiveApi } from '@studiometa/productive-api';
export { ProductiveApiError } from '@studiometa/productive-api';

import { getConfig } from './config.js';
import { getCache } from './utils/cache.js';

export class ProductiveApi extends BaseProductiveApi {
  constructor(options?: Record<string, string | boolean>) {
    const config = getConfig(options);
    const useCache = options?.['no-cache'] !== true;

    super({
      config: {
        apiToken: config.apiToken,
        organizationId: config.organizationId,
        userId: config.userId,
        baseUrl: config.baseUrl,
      },
      cache: getCache(useCache),
      useCache,
      forceRefresh: options?.refresh === true,
    });
  }
}
