/**
 * SQLite-based cache for reference data (projects, people, services)
 * Enables local search and offline access
 *
 * Uses Node.js native sqlite module (Node 22+)
 */

import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Dynamic import to handle the experimental warning gracefully
let DatabaseSync: typeof import('node:sqlite').DatabaseSync;

// Suppress the experimental warning for SQLite globally
const originalEmit = process.emit;
// @ts-expect-error - Monkey-patching process.emit to suppress warning
process.emit = function (event: string, ...args: unknown[]) {
  if (
    event === 'warning' &&
    args[0] &&
    (args[0] as Error).name === 'ExperimentalWarning' &&
    (args[0] as Error).message.includes('SQLite')
  ) {
    return false;
  }
  return originalEmit.apply(process, [event, ...args] as Parameters<typeof originalEmit>);
};

async function loadSqlite() {
  if (!DatabaseSync) {
    const sqlite = await import('node:sqlite');
    DatabaseSync = sqlite.DatabaseSync;
  }
  return DatabaseSync;
}

interface CachedProject {
  id: string;
  name: string;
  project_number: string | null;
  archived: boolean;
  company_id: string | null;
  data: string; // JSON
  synced_at: number;
}

interface CachedPerson {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  active: boolean;
  company_id: string | null;
  data: string; // JSON
  synced_at: number;
}

interface CachedService {
  id: string;
  name: string;
  project_id: string | null;
  deal_id: string | null;
  data: string; // JSON
  synced_at: number;
}

const SCHEMA = `
  -- Metadata
  CREATE TABLE IF NOT EXISTS _meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  -- API Query Cache (key-value store with TTL)
  CREATE TABLE IF NOT EXISTS cache (
    key TEXT PRIMARY KEY,
    data JSON NOT NULL,
    endpoint TEXT NOT NULL,
    params JSON NOT NULL DEFAULT '{}',
    expires_at INTEGER NOT NULL,
    stale_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
  CREATE INDEX IF NOT EXISTS idx_cache_endpoint ON cache(endpoint);
  CREATE INDEX IF NOT EXISTS idx_cache_stale ON cache(stale_at);

  -- Refresh queue for stale cache entries
  CREATE TABLE IF NOT EXISTS refresh_queue (
    cache_key TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    params JSON NOT NULL,
    queued_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_refresh_queue_queued ON refresh_queue(queued_at);

  -- Projects
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_number TEXT,
    archived INTEGER DEFAULT 0,
    company_id TEXT,
    data JSON NOT NULL,
    synced_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);

  -- People
  CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    active INTEGER DEFAULT 1,
    company_id TEXT,
    data JSON NOT NULL,
    synced_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_people_name ON people(first_name COLLATE NOCASE, last_name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_people_email ON people(email COLLATE NOCASE);

  -- Services
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT,
    deal_id TEXT,
    data JSON NOT NULL,
    synced_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_services_name ON services(name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_services_project ON services(project_id);
`;

// Default TTL for SQLite cache (1 hour)
const DEFAULT_TTL = 3600 * 1000;

export class SqliteCache {
  private db: InstanceType<typeof import('node:sqlite').DatabaseSync> | null = null;
  private dbPath: string;
  private orgId: string;
  private initialized = false;

  constructor(orgId: string) {
    const cacheBase = process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
    const cacheDir = join(cacheBase, 'productive-cli');

    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }

    // Separate database per organization
    this.dbPath = join(cacheDir, `productive-${orgId}.db`);
    this.orgId = orgId;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const DB = await loadSqlite();
    this.db = new DB(this.dbPath);
    this.db.exec(SCHEMA);
    this.initialized = true;
  }

  private isStale(syncedAt: number, ttl = DEFAULT_TTL): boolean {
    return Date.now() - syncedAt > ttl;
  }

  // ============ Projects ============

  async upsertProjects(
    projects: Array<{
      id: string;
      attributes: {
        name: string;
        project_number?: string;
        archived?: boolean;
      };
      relationships?: {
        company?: { data?: { id: string } };
      };
    }>,
  ): Promise<void> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO projects (id, name, project_number, archived, company_id, data, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    for (const p of projects) {
      stmt.run(
        p.id,
        p.attributes.name,
        p.attributes.project_number || null,
        p.attributes.archived ? 1 : 0,
        p.relationships?.company?.data?.id || null,
        JSON.stringify(p),
        now,
      );
    }
  }

  async searchProjects(query: string, limit = 50): Promise<CachedProject[]> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(`
      SELECT * FROM projects
      WHERE name LIKE ? OR project_number LIKE ?
      ORDER BY name COLLATE NOCASE
      LIMIT ?
    `);

    const pattern = `%${query}%`;
    return stmt.all(pattern, pattern, limit) as unknown as CachedProject[];
  }

  async getAllProjects(): Promise<CachedProject[]> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare('SELECT * FROM projects ORDER BY name COLLATE NOCASE');
    return stmt.all() as unknown as CachedProject[];
  }

  async getProjectsSyncTime(): Promise<number | null> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare('SELECT MAX(synced_at) as max_sync FROM projects');
    const result = stmt.get() as { max_sync: number | null };
    return result?.max_sync || null;
  }

  async isProjectsCacheValid(ttl = DEFAULT_TTL): Promise<boolean> {
    const syncTime = await this.getProjectsSyncTime();
    return syncTime !== null && !this.isStale(syncTime, ttl);
  }

  // ============ People ============

  async upsertPeople(
    people: Array<{
      id: string;
      attributes: {
        first_name: string;
        last_name: string;
        email?: string;
        active?: boolean;
      };
      relationships?: {
        company?: { data?: { id: string } };
      };
    }>,
  ): Promise<void> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO people (id, first_name, last_name, email, active, company_id, data, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    for (const p of people) {
      stmt.run(
        p.id,
        p.attributes.first_name,
        p.attributes.last_name,
        p.attributes.email || null,
        p.attributes.active ? 1 : 0,
        p.relationships?.company?.data?.id || null,
        JSON.stringify(p),
        now,
      );
    }
  }

  async searchPeople(query: string, limit = 50): Promise<CachedPerson[]> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(`
      SELECT * FROM people
      WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
      ORDER BY first_name COLLATE NOCASE, last_name COLLATE NOCASE
      LIMIT ?
    `);

    const pattern = `%${query}%`;
    return stmt.all(pattern, pattern, pattern, limit) as unknown as CachedPerson[];
  }

  async getAllPeople(): Promise<CachedPerson[]> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(
      'SELECT * FROM people ORDER BY first_name COLLATE NOCASE, last_name COLLATE NOCASE',
    );
    return stmt.all() as unknown as CachedPerson[];
  }

  async getPeopleSyncTime(): Promise<number | null> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare('SELECT MAX(synced_at) as max_sync FROM people');
    const result = stmt.get() as { max_sync: number | null };
    return result?.max_sync || null;
  }

  async isPeopleCacheValid(ttl = DEFAULT_TTL): Promise<boolean> {
    const syncTime = await this.getPeopleSyncTime();
    return syncTime !== null && !this.isStale(syncTime, ttl);
  }

  // ============ Services ============

  async upsertServices(
    services: Array<{
      id: string;
      attributes: {
        name: string;
      };
      relationships?: {
        project?: { data?: { id: string } };
        deal?: { data?: { id: string } };
      };
    }>,
  ): Promise<void> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO services (id, name, project_id, deal_id, data, synced_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    for (const s of services) {
      stmt.run(
        s.id,
        s.attributes.name,
        s.relationships?.project?.data?.id || null,
        s.relationships?.deal?.data?.id || null,
        JSON.stringify(s),
        now,
      );
    }
  }

  async searchServices(query: string, limit = 50): Promise<CachedService[]> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(`
      SELECT * FROM services
      WHERE name LIKE ?
      ORDER BY name COLLATE NOCASE
      LIMIT ?
    `);

    return stmt.all(`%${query}%`, limit) as unknown as CachedService[];
  }

  async getServicesByProject(projectId: string): Promise<CachedService[]> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(
      'SELECT * FROM services WHERE project_id = ? ORDER BY name COLLATE NOCASE',
    );
    return stmt.all(projectId) as unknown as CachedService[];
  }

  async getServicesSyncTime(): Promise<number | null> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare('SELECT MAX(synced_at) as max_sync FROM services');
    const result = stmt.get() as { max_sync: number | null };
    return result?.max_sync || null;
  }

  async isServicesCacheValid(ttl = DEFAULT_TTL): Promise<boolean> {
    const syncTime = await this.getServicesSyncTime();
    return syncTime !== null && !this.isStale(syncTime, ttl);
  }

  // ============ Query Cache (Key-Value) ============

  /**
   * Staleness threshold (75% of TTL)
   */
  private static readonly STALE_THRESHOLD = 0.75;

  /**
   * Get cached data if not expired, with staleness info
   */
  async cacheGet<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare('SELECT data FROM cache WHERE key = ? AND expires_at > ?');
    const row = stmt.get(key, Date.now()) as { data: string } | undefined;

    if (!row) return null;

    try {
      return JSON.parse(row.data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Get cached data with metadata (for staleness detection)
   */
  async cacheGetWithMeta<T>(key: string): Promise<{
    data: T;
    isStale: boolean;
    endpoint: string;
    params: Record<string, unknown>;
  } | null> {
    await this.ensureInitialized();

    const now = Date.now();
    const stmt = this.db!.prepare(
      'SELECT data, endpoint, params, stale_at, expires_at FROM cache WHERE key = ? AND expires_at > ?',
    );
    const row = stmt.get(key, now) as
      | {
          data: string;
          endpoint: string;
          params: string;
          stale_at: number;
          expires_at: number;
        }
      | undefined;

    if (!row) return null;

    try {
      return {
        data: JSON.parse(row.data) as T,
        isStale: now >= row.stale_at,
        endpoint: row.endpoint,
        params: JSON.parse(row.params) as Record<string, unknown>,
      };
    } catch {
      return null;
    }
  }

  /**
   * Store data with TTL and staleness threshold
   */
  async cacheSet<T>(
    key: string,
    data: T,
    endpoint: string,
    ttlMs: number,
    params: Record<string, unknown> = {},
  ): Promise<void> {
    await this.ensureInitialized();

    const now = Date.now();
    const staleAt = now + Math.floor(ttlMs * SqliteCache.STALE_THRESHOLD);
    const expiresAt = now + ttlMs;

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO cache (key, data, endpoint, params, stale_at, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(key, JSON.stringify(data), endpoint, JSON.stringify(params), staleAt, expiresAt, now);

    // Remove from refresh queue if it was pending
    await this.dequeueRefresh(key);
  }

  /**
   * Check if key exists and is not expired
   */
  async cacheHas(key: string): Promise<boolean> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare('SELECT 1 FROM cache WHERE key = ? AND expires_at > ?');
    const row = stmt.get(key, Date.now());
    return !!row;
  }

  /**
   * Delete a specific cache entry
   */
  async cacheDelete(key: string): Promise<void> {
    await this.ensureInitialized();

    this.db!.prepare('DELETE FROM cache WHERE key = ?').run(key);
  }

  /**
   * Invalidate cache entries matching an endpoint pattern
   */
  async cacheInvalidate(endpointPattern?: string): Promise<number> {
    await this.ensureInitialized();

    if (endpointPattern) {
      const stmt = this.db!.prepare('DELETE FROM cache WHERE endpoint LIKE ?');
      const result = stmt.run(`%${endpointPattern}%`);
      return Number(result.changes);
    } else {
      const stmt = this.db!.prepare('DELETE FROM cache');
      const result = stmt.run();
      return Number(result.changes);
    }
  }

  /**
   * Remove expired entries
   */
  async cacheCleanup(): Promise<number> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare('DELETE FROM cache WHERE expires_at < ?');
    const result = stmt.run(Date.now());
    return Number(result.changes);
  }

  /**
   * Get cache statistics
   */
  async cacheStats(): Promise<{
    entries: number;
    size: number;
    oldestAge: number;
  }> {
    await this.ensureInitialized();

    const countResult = this.db!.prepare(
      'SELECT COUNT(*) as count FROM cache WHERE expires_at > ?',
    ).get(Date.now()) as { count: number };

    const sizeResult = this.db!.prepare(
      'SELECT COALESCE(SUM(LENGTH(data)), 0) as size FROM cache WHERE expires_at > ?',
    ).get(Date.now()) as { size: number };

    const oldestResult = this.db!.prepare(
      'SELECT MIN(created_at) as oldest FROM cache WHERE expires_at > ?',
    ).get(Date.now()) as { oldest: number | null };

    const oldestAge = oldestResult.oldest
      ? Math.round((Date.now() - oldestResult.oldest) / 1000)
      : 0;

    return {
      entries: countResult.count,
      size: sizeResult.size,
      oldestAge,
    };
  }

  // ============ Refresh Queue ============

  /**
   * Queue a cache key for background refresh
   */
  async queueRefresh(
    cacheKey: string,
    endpoint: string,
    params: Record<string, unknown>,
  ): Promise<void> {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(`
      INSERT OR IGNORE INTO refresh_queue (cache_key, endpoint, params, queued_at)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(cacheKey, endpoint, JSON.stringify(params), Date.now());
  }

  /**
   * Remove a cache key from the refresh queue
   */
  async dequeueRefresh(cacheKey: string): Promise<void> {
    await this.ensureInitialized();

    this.db!.prepare('DELETE FROM refresh_queue WHERE cache_key = ?').run(cacheKey);
  }

  /**
   * Get all pending refresh jobs
   */
  async getPendingRefreshJobs(): Promise<
    Array<{
      cacheKey: string;
      endpoint: string;
      params: Record<string, unknown>;
      queuedAt: number;
    }>
  > {
    await this.ensureInitialized();

    const stmt = this.db!.prepare(
      'SELECT cache_key, endpoint, params, queued_at FROM refresh_queue ORDER BY queued_at ASC',
    );
    const rows = stmt.all() as Array<{
      cache_key: string;
      endpoint: string;
      params: string;
      queued_at: number;
    }>;

    return rows.map((row) => ({
      cacheKey: row.cache_key,
      endpoint: row.endpoint,
      params: JSON.parse(row.params) as Record<string, unknown>,
      queuedAt: row.queued_at,
    }));
  }

  /**
   * Get count of pending refresh jobs
   */
  async getRefreshQueueCount(): Promise<number> {
    await this.ensureInitialized();

    const result = this.db!.prepare('SELECT COUNT(*) as count FROM refresh_queue').get() as {
      count: number;
    };

    return result.count;
  }

  /**
   * Clear the entire refresh queue
   */
  async clearRefreshQueue(): Promise<number> {
    await this.ensureInitialized();

    const result = this.db!.prepare('DELETE FROM refresh_queue').run();
    return Number(result.changes);
  }

  // ============ Utilities ============

  async getStats(): Promise<{
    projects: number;
    people: number;
    services: number;
    dbSize: number;
  }> {
    await this.ensureInitialized();

    const projectCount = (
      this.db!.prepare('SELECT COUNT(*) as count FROM projects').get() as {
        count: number;
      }
    ).count;
    const peopleCount = (
      this.db!.prepare('SELECT COUNT(*) as count FROM people').get() as {
        count: number;
      }
    ).count;
    const servicesCount = (
      this.db!.prepare('SELECT COUNT(*) as count FROM services').get() as {
        count: number;
      }
    ).count;

    // Get file size
    const fs = await import('node:fs');
    const stats = fs.statSync(this.dbPath);

    return {
      projects: projectCount,
      people: peopleCount,
      services: servicesCount,
      dbSize: stats.size,
    };
  }

  async clear(): Promise<void> {
    await this.ensureInitialized();

    this.db!.exec('DELETE FROM cache');
    this.db!.exec('DELETE FROM refresh_queue');
    this.db!.exec('DELETE FROM projects');
    this.db!.exec('DELETE FROM people');
    this.db!.exec('DELETE FROM services');
    this.db!.exec('DELETE FROM _meta');
    this.db!.exec('VACUUM');
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Factory function
const instances: Map<string, SqliteCache> = new Map();

export function getSqliteCache(orgId: string): SqliteCache {
  if (!instances.has(orgId)) {
    instances.set(orgId, new SqliteCache(orgId));
  }
  return instances.get(orgId)!;
}

export function clearSqliteCacheInstances(): void {
  for (const cache of instances.values()) {
    cache.close();
  }
  instances.clear();
}
