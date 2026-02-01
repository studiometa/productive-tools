# Caching Strategy

## Table of Contents

- [Overview](#overview)
- [Approach Comparison](#approach-comparison)
- [Option 1: Keyv (Recommandé pour démarrer)](#option-1-keyv-recommandé-pour-démarrer)
- [Option 2: Node.js Native `node:sqlite`](#option-2-nodejs-native-nodesqlite)
  - [Cache Directory (XDG compliant)](#cache-directory-xdg-compliant)
  - [Schema](#schema)
  - [Implementation: CacheStore Class](#implementation-cachestore-class)
- [TTL par type de données](#ttl-par-type-de-données)
- [CLI Flags](#cli-flags)
- [Configuration](#configuration)
- [Cache Invalidation](#cache-invalidation)
- [Implementation Phases](#implementation-phases)
- [Example Usage](#example-usage)
- [Recommendation](#recommendation)

## Overview

This document outlines the caching strategy for the Productive CLI to improve performance and reduce API calls.

## Approach Comparison

| Complexity | Solution | Pros | Cons |
|------------|----------|------|------|
| **Minimale** | `keyv` + `@keyv/sqlite` | 0 code custom, TTL intégré, API simple | Dépendance externe |
| **Moyenne** | `node:sqlite` seul avec table `cache` + TTL | Zero deps, flexible, local search | Plus de code |
| **Maximale** | Hybrid file + SQLite | — | Complexité inutile, à éviter |

## Option 1: Keyv (Recommandé pour démarrer)

Solution clé-en-main avec TTL intégré et persistence SQLite.

### Installation

```bash
npm install keyv @keyv/sqlite
```

### Usage

```typescript
import Keyv from 'keyv';
import KeyvSqlite from '@keyv/sqlite';

const cache = new Keyv({
  store: new KeyvSqlite('sqlite://~/.cache/productive-cli/cache.db'),
  namespace: 'productive',
  ttl: 3600_000, // default 1h
});

// Usage simple
await cache.set('projects', data, 3600_000);  // 1h TTL
await cache.set('time_entries', data, 300_000); // 5min TTL

const projects = await cache.get('projects');
if (!projects) {
  // Fetch from API
}

// Clear
await cache.clear();
```

### Avantages

- Une seule abstraction
- TTL intégré et géré automatiquement
- API simple (`get`, `set`, `delete`, `clear`)
- Storage swappable (SQLite, Redis, etc.)
- Namespace pour isoler les données par org

### Cache Key Strategy

```typescript
// Simple concatenation, pas besoin de hash
function cacheKey(endpoint: string, params: Record<string, unknown>, orgId: string): string {
  const sortedParams = JSON.stringify(params, Object.keys(params).sort());
  return `${orgId}:${endpoint}:${sortedParams}`;
}

// Usage
const key = cacheKey('/projects', { page: 1, per_page: 100 }, '12345');
// → "12345:/projects:{\"page\":1,\"per_page\":100}"
```

## Option 2: Node.js Native `node:sqlite`

Pour plus de contrôle et des fonctionnalités avancées (recherche locale, offline mode).

### Prérequis

- Node.js 22+ (expérimental) ou 24+ (stable)
- Zero dependencies

### Cache Directory (XDG compliant)

```typescript
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

function getCacheDir(): string {
  const cacheDir = process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache');
  const appCacheDir = join(cacheDir, 'productive-cli');
  mkdirSync(appCacheDir, { recursive: true });
  return appCacheDir;
}

const dbPath = join(getCacheDir(), 'cache.db');
```

### Schema

```sql
-- Generic cache table with TTL
CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  data JSON NOT NULL,
  namespace TEXT NOT NULL,
  expires_at INTEGER NOT NULL,  -- Unix timestamp ms
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_cache_expires ON cache(expires_at);
CREATE INDEX idx_cache_namespace ON cache(namespace);

-- Structured tables for local search (optional)
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_number TEXT,
  archived INTEGER DEFAULT 0,
  company_id TEXT,
  data JSON NOT NULL,
  synced_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_projects_name ON projects(name COLLATE NOCASE);

CREATE TABLE people (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  active INTEGER DEFAULT 1,
  data JSON NOT NULL,
  synced_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_people_name ON people(first_name COLLATE NOCASE, last_name COLLATE NOCASE);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT,
  data JSON NOT NULL,
  synced_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_services_project ON services(project_id);
```

### Implementation: CacheStore Class

```typescript
import { DatabaseSync } from 'node:sqlite';
import { statSync } from 'node:fs';

interface CacheRow {
  data: string;
  expires_at: number;
}

class CacheStore {
  private db: DatabaseSync;
  private maxSizeBytes: number;

  constructor(dbPath: string, maxSizeBytes = 50 * 1024 * 1024) {
    this.db = new DatabaseSync(dbPath);
    this.maxSizeBytes = maxSizeBytes;
    this.init();
    this.cleanup();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        data JSON NOT NULL,
        namespace TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
      CREATE INDEX IF NOT EXISTS idx_cache_namespace ON cache(namespace);
    `);
  }

  private cleanup(): void {
    this.db.exec(`DELETE FROM cache WHERE expires_at < ${Date.now()}`);
  }

  get<T>(key: string): T | null {
    const row = this.db.prepare(
      'SELECT data FROM cache WHERE key = ? AND expires_at > ?'
    ).get(key, Date.now()) as CacheRow | undefined;
    return row ? JSON.parse(row.data) : null;
  }

  set<T>(key: string, data: T, ttlMs: number, namespace = 'default'): void {
    const now = Date.now();
    this.db.prepare(`
      INSERT OR REPLACE INTO cache (key, data, namespace, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(key, JSON.stringify(data), namespace, now + ttlMs, now);
    this.pruneIfNeeded();
  }

  has(key: string): boolean {
    const row = this.db.prepare(
      'SELECT 1 FROM cache WHERE key = ? AND expires_at > ?'
    ).get(key, Date.now());
    return !!row;
  }

  getTtl(key: string): number | null {
    const row = this.db.prepare(
      'SELECT expires_at FROM cache WHERE key = ?'
    ).get(key) as { expires_at: number } | undefined;
    if (!row) return null;
    const remaining = row.expires_at - Date.now();
    return remaining > 0 ? remaining : null;
  }

  delete(key: string): void {
    this.db.prepare('DELETE FROM cache WHERE key = ?').run(key);
  }

  clear(namespace?: string): void {
    if (namespace) {
      this.db.prepare('DELETE FROM cache WHERE namespace = ?').run(namespace);
    } else {
      this.db.exec('DELETE FROM cache');
    }
  }

  private pruneIfNeeded(): void {
    try {
      const { size } = statSync(this.db./* get path somehow */);
      if (size > this.maxSizeBytes) {
        this.db.exec(`
          DELETE FROM cache WHERE key IN (
            SELECT key FROM cache ORDER BY created_at ASC LIMIT 100
          )
        `);
        this.db.exec('VACUUM');
      }
    } catch {
      // Ignore stat errors
    }
  }

  // Bulk operations with transaction
  setMany<T>(entries: Array<{ key: string; data: T; ttlMs: number; namespace?: string }>): void {
    try {
      this.db.exec('BEGIN');
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO cache (key, data, namespace, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const now = Date.now();
      for (const { key, data, ttlMs, namespace = 'default' } of entries) {
        stmt.run(key, JSON.stringify(data), namespace, now + ttlMs, now);
      }
      this.db.exec('COMMIT');
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    }
  }

  close(): void {
    this.db.close();
  }
}
```

### Usage

```typescript
const cache = new CacheStore(dbPath);

// Basic operations
cache.set('projects:123', projectData, 3600_000); // 1h TTL
const data = cache.get<Project[]>('projects:123');

// Check existence (useful for --offline)
if (cache.has('projects:123')) {
  // Use cached data
}

// Get remaining TTL (useful for cache status)
const ttl = cache.getTtl('projects:123'); // ms or null

// Bulk insert with transaction
cache.setMany([
  { key: 'project:1', data: p1, ttlMs: 3600_000 },
  { key: 'project:2', data: p2, ttlMs: 3600_000 },
]);

// Clear
cache.clear('productive'); // Clear namespace
cache.clear(); // Clear all
```

### Note sur l'API synchrone

L'API `DatabaseSync` de `node:sqlite` est synchrone. C'est adapté pour une CLI mais attention dans les boucles — utiliser `setMany()` avec transaction :

```typescript
// ❌ Éviter
for (const item of items) {
  cache.set(`key:${item.id}`, item, ttl);
}

// ✅ Préférer
cache.setMany(items.map(item => ({
  key: `key:${item.id}`,
  data: item,
  ttlMs: ttl,
})));
```

## TTL par type de données

| Data Type | TTL | Raison |
|-----------|-----|--------|
| Projects | 1h | Change rarement |
| People | 1h | Change rarement |
| Services | 1h | Change rarement |
| Companies | 1h | Change rarement |
| Time entries | 5min | Change souvent |
| Tasks | 15min | Change modérément |
| Budgets | 15min | Change modérément |

## CLI Flags

```
Global cache options:
  --no-cache          Bypass cache, fetch fresh data
  --refresh           Force refresh cache for this query
  --offline           Use only cached data (fail if not available)

Cache management commands:
  productive cache status    Show cache stats (size, age, entries)
  productive cache sync      Sync all reference data
  productive cache clear     Clear all cached data
```

## Configuration

```json
// ~/.config/productive-cli/config.json
{
  "cache": {
    "enabled": true,
    "maxSizeMB": 50,
    "ttl": {
      "projects": 3600,
      "people": 3600,
      "services": 3600,
      "time_entries": 300,
      "tasks": 900,
      "budgets": 900
    }
  }
}
```

## Cache Invalidation

### Automatic

- After any write operation (create, update, delete)
- When TTL expires
- When switching organization

### Manual

- `productive cache clear`
- `--refresh` flag

## Implementation Phases

### Phase 1: Simple Cache (Keyv)

- Install `keyv` + `@keyv/sqlite`
- Implement basic get/set with TTL
- Add `--no-cache` and `--refresh` flags
- ~50 lines of code

### Phase 2: Local Search (node:sqlite)

- Add structured tables for projects, people, services
- Implement local search (`--search` flag)
- Add sync command
- ~200 lines additional

### Phase 3: Smart Features

- Offline mode
- Cache statistics
- Background sync

## Example Usage

```bash
# First call - fetches from API, caches result
$ productive projects list
# ... results ...

# Second call within TTL - instant from cache
$ productive projects list
# ... same results, instant ...

# Force refresh
$ productive projects list --refresh
# ... fresh results from API ...

# Search locally (Phase 2, with SQLite)
$ productive projects list --search "website"
# ... filtered locally, no API call ...

# Check cache status
$ productive cache status
Cache location: ~/.cache/productive-cli/
Database size: 2.3 MB
Entries: 234
  - projects: 156 entries, synced 45 min ago
  - people: 42 entries, synced 45 min ago
  - services: 234 entries, synced 45 min ago

# Clear cache
$ productive cache clear
Cache cleared.
```

## Recommendation

**Start with Keyv** (Phase 1) for immediate benefits with minimal code. Evaluate SQLite structured tables (Phase 2) based on user feedback and need for local search.

Since we target Node 24+, using `node:sqlite` later is a good option that avoids external dependencies for the full implementation.
