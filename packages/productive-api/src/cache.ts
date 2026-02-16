/**
 * Cache interface for the API client.
 * Implementations can be in-memory, SQLite, file-based, etc.
 */
export interface ApiCache {
  getAsync<T>(endpoint: string, query: Record<string, unknown>, orgId: string): Promise<T | null>;
  setAsync<T>(
    endpoint: string,
    query: Record<string, unknown>,
    orgId: string,
    data: T,
  ): Promise<void>;
  invalidateAsync(resource: string): Promise<void | number>;
  setOrgId(orgId: string): void;
}

/**
 * No-op cache implementation for when caching is disabled.
 */
export const noopCache: ApiCache = {
  async getAsync() {
    return null;
  },
  async setAsync() {},
  async invalidateAsync() {},
  setOrgId() {},
};
