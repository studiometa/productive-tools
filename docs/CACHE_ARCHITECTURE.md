# Cache Architecture

## Overview

The Productive CLI implements a two-tier caching system:

1. **File Cache** - For API query responses (short TTL)
2. **SQLite Cache** - For reference data with local search capabilities (long TTL)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Productive CLI                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    ProductiveApi        │
                    │    (src/api.ts)         │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────────┐   ┌──────────────────────┐
        │   FileCache           │   │   SqliteCache        │
        │   (cache.ts)          │   │   (sqlite-cache.ts)  │
        └───────────────────────┘   └──────────────────────┘
                    │                           │
                    ▼                           ▼
    ┌───────────────────────────┐   ┌──────────────────────────┐
    │  ~/.cache/productive-cli/ │   │  ~/.cache/productive-cli/│
    │  queries/                 │   │  productive-{orgId}.db   │
    │  └─ {hash}.json          │   │  ┌─ projects            │
    │                           │   │  ├─ people              │
    └───────────────────────────┘   │  └─ services            │
                                     └──────────────────────────┘
```

---

## Cache Types

### 1. File Cache (Query Cache)

**Purpose:** Cache API responses for fast retrieval

**Location:** `~/.cache/productive-cli/queries/{hash}.json`

**Characteristics:**

- Caches any GET request response
- Uses SHA256 hash of endpoint + params + orgId as key
- TTL-based expiration (varies by endpoint)
- Automatic cleanup when cache exceeds size limits
- Invalidated on write operations (POST/PUT/DELETE)

**TTL Configuration:**

```
┌────────────────┬─────────┬─────────────────┐
│ Endpoint       │ TTL     │ Reason          │
├────────────────┼─────────┼─────────────────┤
│ /projects      │ 1 hour  │ Rarely changes  │
│ /people        │ 1 hour  │ Rarely changes  │
│ /services      │ 1 hour  │ Rarely changes  │
│ /time_entries  │ 5 min   │ Changes often   │
│ /tasks         │ 15 min  │ Moderate change │
│ /budgets       │ 15 min  │ Moderate change │
└────────────────┴─────────┴─────────────────┘
```

**File Structure:**

```json
{
  "data": {
    /* API response */
  },
  "timestamp": 1705930800000,
  "ttl": 3600,
  "endpoint": "/projects",
  "params": { "page": 1 }
}
```

---

### 2. SQLite Cache (Reference Data)

**Purpose:** Store reference data with searchable indexes for offline access

**Location:** `~/.cache/productive-cli/productive-{orgId}.db`

**Characteristics:**

- Separate database per organization
- Structured tables with indexes for fast search
- Case-insensitive search
- Full JSON data preserved for each record
- Synced via `productive cache sync`

**Schema:**

```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_number TEXT,
  archived INTEGER DEFAULT 0,
  company_id TEXT,
  data JSON NOT NULL,              -- Full API response
  synced_at INTEGER NOT NULL       -- Unix timestamp (ms)
);
CREATE INDEX idx_projects_name ON projects(name COLLATE NOCASE);
CREATE INDEX idx_projects_company ON projects(company_id);

-- People table
CREATE TABLE people (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  active INTEGER DEFAULT 1,
  company_id TEXT,
  data JSON NOT NULL,
  synced_at INTEGER NOT NULL
);
CREATE INDEX idx_people_name ON people(first_name COLLATE NOCASE, last_name COLLATE NOCASE);
CREATE INDEX idx_people_email ON people(email COLLATE NOCASE);

-- Services table
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT,
  deal_id TEXT,
  data JSON NOT NULL,
  synced_at INTEGER NOT NULL
);
CREATE INDEX idx_services_name ON services(name COLLATE NOCASE);
CREATE INDEX idx_services_project ON services(project_id);
```

---

## Data Flow

### 1. GET Request with File Cache

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. API Request
     ▼
┌─────────────────────┐
│  ProductiveApi      │
│                     │
│  request(GET ...)   │
└──────┬──────────────┘
       │
       │ 2. Check cache
       ▼
┌─────────────────────┐        ┌──────────────┐
│  FileCache          │  HIT   │ Return cached│
│  get(key)           ├───────▶│ data         │
└──────┬──────────────┘        └──────────────┘
       │ MISS
       │ 3. Fetch from API
       ▼
┌─────────────────────┐
│  Productive.io API  │
└──────┬──────────────┘
       │ 4. Response
       ▼
┌─────────────────────┐
│  FileCache          │
│  set(key, data)     │  5. Cache response
└──────┬──────────────┘
       │ 6. Return data
       ▼
┌──────────┐
│  Client  │
└──────────┘
```

### 2. Cache Sync Flow

```
┌──────────────────┐
│  cache sync CMD  │
└────────┬─────────┘
         │ 1. Start sync
         ▼
  ┌──────────────────┐
  │  ProductiveApi   │
  │  getProjects()   │
  │  getPeople()     │
  │  getServices()   │
  └────────┬─────────┘
           │ 2. Paginate all data
           │    (page 1, 2, 3...)
           ▼
  ┌────────────────────┐
  │  Productive.io API │
  └────────┬───────────┘
           │ 3. All records
           ▼
  ┌────────────────────┐
  │  SqliteCache       │
  │  upsertProjects()  │
  │  upsertPeople()    │
  │  upsertServices()  │
  └────────┬───────────┘
           │ 4. INSERT OR REPLACE
           ▼
  ┌────────────────────────┐
  │  SQLite Database       │
  │  (projects, people,    │
  │   services tables)     │
  └────────────────────────┘
```

### 3. Local Search Flow

```
┌──────────────────────┐
│  Future Feature:     │
│  Search command      │
│                      │
│  productive search   │
│    "project name"    │
└──────────┬───────────┘
           │ 1. Search query
           ▼
  ┌────────────────────┐
  │  SqliteCache       │
  │  searchProjects()  │
  └────────┬───────────┘
           │ 2. SQL query with LIKE
           │    SELECT * FROM projects
           │    WHERE name LIKE '%query%'
           ▼
  ┌────────────────────────┐
  │  SQLite Database       │
  │  (indexed search)      │
  └────────┬───────────────┘
           │ 3. Matching records
           ▼
  ┌────────────────────┐
  │  Display results   │
  └────────────────────┘
```

---

## Cache Management Commands

### `productive cache status`

Shows statistics for both caches:

```bash
$ productive cache status

Cache Statistics
────────────────────────────────────────────────────────────

File Cache (API Queries):
  Entries: 42
  Size: 1.2 MB
  Oldest entry: 23m ago
  Location: ~/.cache/productive-cli/queries/

SQLite Cache (Reference Data):
  Projects: 156
  People: 42
  Services: 234
  Size: 890 KB
  Location: ~/.cache/productive-cli/productive-12345.db
```

### `productive cache sync`

Syncs all reference data to SQLite cache:

```bash
$ productive cache sync

⠋ Syncing projects... (page 2/3)
✓ Synced 156 projects
⠋ Syncing people...
✓ Synced 42 people
⠋ Syncing services... (page 1/2)
✓ Synced 234 services

✓ Cache sync completed
  Database size: 890 KB
```

### `productive cache clear`

Clears both caches:

```bash
$ productive cache clear
✓ All caches cleared (file + SQLite)

$ productive cache clear projects
✓ File cache cleared for pattern: projects
```

---

## Global Cache Flags

### `--no-cache`

Bypass cache for a single command:

```bash
$ productive projects list --no-cache
# Fetches fresh data, doesn't check or update cache
```

### `--refresh`

Force refresh cache:

```bash
$ productive projects list --refresh
# Fetches fresh data, updates cache
```

---

## Cache Invalidation

### Automatic Invalidation

Write operations (POST, PUT, DELETE) automatically invalidate related cache:

```typescript
// Creating a time entry
api.createTimeEntry(...)
// → Invalidates all /time_entries/* cache entries
```

### Manual Invalidation

```bash
# Clear all cache
$ productive cache clear

# Clear specific endpoint pattern
$ productive cache clear time
```

---

## Implementation Details

### File Cache (cache.ts)

```typescript
class FileCache {
  private cacheDir: string;

  // Get cache key from endpoint + params
  private getCacheKey(endpoint, params, orgId): string {
    const hash = SHA256(endpoint + orgId + JSON.stringify(params));
    return hash.substring(0, 16);
  }

  // Check TTL and return cached data
  get<T>(endpoint, params, orgId): T | null {
    const entry = readCacheFile(key);
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      return null; // Expired
    }
    return entry.data;
  }

  // Store with TTL
  set<T>(endpoint, params, orgId, data, options): void {
    const ttl = this.getTTL(endpoint, options?.ttl);
    writeCacheFile(key, { data, timestamp: Date.now(), ttl });
  }
}
```

### SQLite Cache (sqlite-cache.ts)

```typescript
class SqliteCache {
  private db: DatabaseSync;

  // Upsert projects with transaction
  async upsertProjects(projects): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO projects (id, name, ..., data, synced_at)
      VALUES (?, ?, ..., ?, ?)
    `);

    const now = Date.now();
    for (const p of projects) {
      stmt.run(p.id, p.attributes.name, ..., JSON.stringify(p), now);
    }
  }

  // Case-insensitive search
  async searchProjects(query, limit = 50): Promise<CachedProject[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM projects
      WHERE name LIKE ? OR project_number LIKE ?
      ORDER BY name COLLATE NOCASE
      LIMIT ?
    `);
    return stmt.all(`%${query}%`, `%${query}%`, limit);
  }

  // Check cache freshness
  async isProjectsCacheValid(ttl = 3600000): Promise<boolean> {
    const syncTime = await this.getProjectsSyncTime();
    return syncTime !== null && (Date.now() - syncTime) < ttl;
  }
}
```

---

## Performance Characteristics

### File Cache

| Operation    | Time Complexity | Notes              |
| ------------ | --------------- | ------------------ |
| get()        | O(1)            | File read by hash  |
| set()        | O(1)            | File write         |
| invalidate() | O(n)            | Scans all files    |
| cleanup()    | O(n log n)      | Sorts by timestamp |

**Space:** Up to 50MB, up to 1000 files

### SQLite Cache

| Operation        | Time Complexity | Notes               |
| ---------------- | --------------- | ------------------- |
| upsertProjects() | O(n)            | Batch INSERT        |
| searchProjects() | O(log n)        | Indexed LIKE search |
| getProjectById() | O(1)            | Primary key lookup  |
| getAllProjects() | O(n)            | Full table scan     |

**Space:** Typically 500KB - 5MB depending on org size

---

## Future Enhancements

### Phase 3 (Future)

1. **Offline Mode**
   - Use SQLite cache when API is unavailable
   - Flag to force offline mode

2. **Smart Search Command**

   ```bash
   $ productive search "acme corp"
   Projects:
     • ACME Website Redesign (PRJ-001)
     • ACME Mobile App (PRJ-042)

   People:
     • John Doe (john@acme.com)
   ```

3. **Background Sync**
   - Auto-sync on startup if cache is stale
   - Configurable sync intervals

4. **Cache Warming**
   - Pre-populate cache for common queries
   - Smart prediction based on usage patterns

5. **Compression**
   - Compress JSON data in SQLite
   - gzip file cache entries

---

## Testing

### File Cache Tests

- ✅ TTL expiration
- ✅ Cache invalidation
- ✅ Cleanup on size limits
- ✅ Concurrent access

### SQLite Cache Tests

- ✅ CRUD operations (mocked node:sqlite)
- ✅ Case-insensitive search
- ✅ TTL validation
- ✅ Data persistence
- ✅ Singleton pattern

### Integration Tests

- ⏳ End-to-end cache flow
- ⏳ Sync command
- ⏳ Multi-page pagination

---

## Configuration

### Environment Variables

```bash
# Cache directory (XDG compliant)
export XDG_CACHE_HOME=~/.cache

# Organization ID (required for SQLite cache)
export PRODUCTIVE_ORG_ID=12345
```

### Future: Configuration File

```json
{
  "cache": {
    "enabled": true,
    "maxSizeMB": 50,
    "ttl": {
      "projects": 3600,
      "people": 3600,
      "services": 3600,
      "time_entries": 300
    }
  }
}
```

---

## Troubleshooting

### Clear corrupted cache

```bash
rm -rf ~/.cache/productive-cli/
```

### Verify SQLite database

```bash
sqlite3 ~/.cache/productive-cli/productive-12345.db ".tables"
```

### Check cache status

```bash
productive cache status --format json
```

---

## Summary

The Productive CLI implements a **dual-cache architecture**:

1. **File Cache** - Fast, automatic, TTL-based caching for all API queries
2. **SQLite Cache** - Structured, searchable reference data with offline capabilities

This approach provides:

- ⚡ Fast response times (cache hits)
- 🔍 Local search capabilities
- 📡 Reduced API calls
- 💾 Offline access to reference data
- 🎯 Optimized for common CLI workflows

The architecture is designed to be:

- **Simple**: Zero configuration for basic use
- **Fast**: Indexed searches, minimal overhead
- **Reliable**: Graceful degradation if cache unavailable
- **Extensible**: Easy to add new cached resources
