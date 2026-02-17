import { createHash } from 'node:crypto';

import { getSqliteCache, type SqliteCache } from './sqlite-cache.js';

interface CacheOptions {
  ttl?: number; // TTL in seconds
}

interface CacheGetResult<T> {
  data: T;
  isStale: boolean;
}

// Default TTLs by endpoint pattern (in seconds)
const DEFAULT_TTLS: Record<string, number> = {
  '/projects': 3600, // 1 hour
  '/people': 3600, // 1 hour
  '/services': 3600, // 1 hour
  '/time_entries': 300, // 5 minutes
  '/tasks': 900, // 15 minutes
  '/budgets': 900, // 15 minutes
};

/**
 * Cache store using SQLite for persistence.
 * Supports stale-while-revalidate pattern with background refresh queue.
 */
export class CacheStore {
  private sqliteCache: SqliteCache | null = null;
  private enabled: boolean;
  private orgId: string | null = null;

  constructor(enabled = true) {
    this.enabled = enabled;
  }

  /**
   * Set the organization ID (required for SQLite cache)
   */
  setOrgId(orgId: string): void {
    if (this.orgId !== orgId) {
      this.orgId = orgId;
      this.sqliteCache = null; // Reset cache on org change
    }
  }

  /**
   * Get the SQLite cache instance (lazy initialization)
   */
  private getCache(): SqliteCache | null {
    if (!this.enabled || !this.orgId) return null;

    if (!this.sqliteCache) {
      this.sqliteCache = getSqliteCache(this.orgId);
    }
    return this.sqliteCache;
  }

  /**
   * Generate a cache key from endpoint and params
   */
  private getCacheKey(endpoint: string, params: Record<string, unknown>, orgId: string): string {
    // Sort params keys for consistent hashing
    const sortedParams = Object.keys(params)
      .slice()
      .toSorted()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, unknown>,
      );

    const normalized = JSON.stringify({
      endpoint,
      orgId,
      params: sortedParams,
    });
    return createHash('sha256').update(normalized).digest('hex').substring(0, 16);
  }

  /**
   * Get the TTL for an endpoint (in milliseconds)
   */
  private getTTL(endpoint: string, customTTL?: number): number {
    const ttlSeconds = customTTL !== undefined ? customTTL : this.getDefaultTTL(endpoint);
    return ttlSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Get default TTL in seconds for an endpoint
   */
  private getDefaultTTL(endpoint: string): number {
    for (const [pattern, ttl] of Object.entries(DEFAULT_TTLS)) {
      if (endpoint.startsWith(pattern)) {
        return ttl;
      }
    }
    return 300; // Default 5 minutes
  }

  /**
   * Get cached data if valid
   */
  get<T>(endpoint: string, params: Record<string, unknown>, orgId: string): T | null {
    if (!this.enabled) return null;

    this.setOrgId(orgId);
    const cache = this.getCache();
    if (!cache) return null;

    try {
      const key = this.getCacheKey(endpoint, params, orgId);
      // Use synchronous-style access via Promise.resolve for compatibility
      // Note: In actual usage, the caller should use await
      let result: T | null = null;
      cache
        .cacheGet<T>(key)
        .then((data) => {
          result = data;
        })
        .catch(() => {});
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Get cached data if valid (async version)
   * Returns data and staleness info. If stale, queues for background refresh.
   */
  async getAsync<T>(
    endpoint: string,
    params: Record<string, unknown>,
    orgId: string,
  ): Promise<T | null> {
    if (!this.enabled) return null;

    this.setOrgId(orgId);
    const cache = this.getCache();
    if (!cache) return null;

    try {
      const key = this.getCacheKey(endpoint, params, orgId);
      const result = await cache.cacheGetWithMeta<T>(key);

      if (!result) return null;

      // If stale, queue for background refresh
      if (result.isStale) {
        await cache.queueRefresh(key, endpoint, params);
      }

      return result.data;
    } catch {
      return null;
    }
  }

  /**
   * Get cached data with staleness info (async version)
   * Allows caller to know if data is stale without triggering queue.
   */
  async getWithMetaAsync<T>(
    endpoint: string,
    params: Record<string, unknown>,
    orgId: string,
  ): Promise<CacheGetResult<T> | null> {
    if (!this.enabled) return null;

    this.setOrgId(orgId);
    const cache = this.getCache();
    if (!cache) return null;

    try {
      const key = this.getCacheKey(endpoint, params, orgId);
      const result = await cache.cacheGetWithMeta<T>(key);

      if (!result) return null;

      return {
        data: result.data,
        isStale: result.isStale,
      };
    } catch {
      return null;
    }
  }

  /**
   * Store data in cache
   */
  set<T>(
    endpoint: string,
    params: Record<string, unknown>,
    orgId: string,
    data: T,
    options?: CacheOptions,
  ): void {
    if (!this.enabled) return;

    this.setOrgId(orgId);
    const cache = this.getCache();
    if (!cache) return;

    try {
      const key = this.getCacheKey(endpoint, params, orgId);
      const ttl = this.getTTL(endpoint, options?.ttl);

      // Fire and forget
      cache.cacheSet(key, data, endpoint, ttl, params).catch(() => {});

      // Cleanup expired entries periodically (async, don't block)
      setImmediate(() => {
        cache.cacheCleanup().catch(() => {});
      });
    } catch {
      // Silently fail cache writes
    }
  }

  /**
   * Store data in cache (async version)
   */
  async setAsync<T>(
    endpoint: string,
    params: Record<string, unknown>,
    orgId: string,
    data: T,
    options?: CacheOptions,
  ): Promise<void> {
    if (!this.enabled) return;

    this.setOrgId(orgId);
    const cache = this.getCache();
    if (!cache) return;

    try {
      const key = this.getCacheKey(endpoint, params, orgId);
      const ttl = this.getTTL(endpoint, options?.ttl);
      await cache.cacheSet(key, data, endpoint, ttl, params);
    } catch {
      // Silently fail cache writes
    }
  }

  /**
   * Invalidate cache for an endpoint pattern
   */
  invalidate(endpointPattern?: string): void {
    if (!this.enabled) return;

    const cache = this.getCache();
    if (!cache) return;

    try {
      cache.cacheInvalidate(endpointPattern).catch(() => {});
    } catch {
      // Silently fail
    }
  }

  /**
   * Invalidate cache for an endpoint pattern (async version)
   */
  async invalidateAsync(endpointPattern?: string): Promise<number> {
    if (!this.enabled) return 0;

    const cache = this.getCache();
    if (!cache) return 0;

    try {
      return await cache.cacheInvalidate(endpointPattern);
    } catch {
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.invalidate();
  }

  /**
   * Get cache statistics
   */
  stats(): { entries: number; size: number; oldestAge: number } {
    if (!this.enabled) {
      return { entries: 0, size: 0, oldestAge: 0 };
    }

    const cache = this.getCache();
    if (!cache) {
      return { entries: 0, size: 0, oldestAge: 0 };
    }

    // For sync compatibility, return empty stats
    // Use statsAsync for actual stats
    return { entries: 0, size: 0, oldestAge: 0 };
  }

  /**
   * Get cache statistics (async version)
   */
  async statsAsync(): Promise<{
    entries: number;
    size: number;
    oldestAge: number;
  }> {
    if (!this.enabled) {
      return { entries: 0, size: 0, oldestAge: 0 };
    }

    const cache = this.getCache();
    if (!cache) {
      return { entries: 0, size: 0, oldestAge: 0 };
    }

    try {
      return await cache.cacheStats();
    } catch {
      return { entries: 0, size: 0, oldestAge: 0 };
    }
  }

  /**
   * Get pending refresh jobs count
   */
  async getRefreshQueueCountAsync(): Promise<number> {
    if (!this.enabled) return 0;

    const cache = this.getCache();
    if (!cache) return 0;

    try {
      return await cache.getRefreshQueueCount();
    } catch {
      return 0;
    }
  }

  /**
   * Get all pending refresh jobs
   */
  async getPendingRefreshJobsAsync(): Promise<
    Array<{
      cacheKey: string;
      endpoint: string;
      params: Record<string, unknown>;
      queuedAt: number;
    }>
  > {
    if (!this.enabled) return [];

    const cache = this.getCache();
    if (!cache) return [];

    try {
      return await cache.getPendingRefreshJobs();
    } catch {
      return [];
    }
  }

  /**
   * Remove a job from the refresh queue
   */
  async dequeueRefreshAsync(cacheKey: string): Promise<void> {
    if (!this.enabled) return;

    const cache = this.getCache();
    if (!cache) return;

    try {
      await cache.dequeueRefresh(cacheKey);
    } catch {
      // Silently fail
    }
  }

  /**
   * Clear the entire refresh queue
   */
  async clearRefreshQueueAsync(): Promise<number> {
    if (!this.enabled) return 0;

    const cache = this.getCache();
    if (!cache) return 0;

    try {
      return await cache.clearRefreshQueue();
    } catch {
      return 0;
    }
  }
}

// Keep FileCache as an alias for backward compatibility
export { CacheStore as FileCache };

// Singleton instance
let cacheInstance: CacheStore | null = null;

export function getCache(enabled = true): CacheStore {
  if (!cacheInstance) {
    cacheInstance = new CacheStore(enabled);
  }
  return cacheInstance;
}

export function disableCache(): void {
  cacheInstance = new CacheStore(false);
}

export function resetCache(): void {
  cacheInstance = null;
}

export function clearCache(): void {
  getCache().clear();
}
