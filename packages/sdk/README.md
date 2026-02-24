# @studiometa/productive-sdk

Fluent TypeScript SDK for the [Productive.io](https://productive.io) API.

Built on top of `@studiometa/productive-api`, the SDK adds:

- **JSON:API include resolution** — relationships automatically inlined as flat objects
- **Async pagination** — `for await` iteration across all pages
- **Fluent API** — `p.projects.list()`, `p.tasks.get(id)`, `p.deals.create(data)`

## Installation

```bash
npm install @studiometa/productive-sdk
```

## Quick Start

```typescript
import { Productive } from '@studiometa/productive-sdk';

const p = new Productive({
  token: 'pk_live_...',
  organizationId: '12345',
  userId: 'user-id', // optional, needed for people.me()
});

// List projects
const { data: projects } = await p.projects.list();
console.log(projects[0].name); // directly on the resolved object

// Get a task with relationships resolved
const { data: task } = await p.tasks.get('456', {
  include: ['project', 'assignee'],
});
console.log(task.project?.name); // inlined from included array
console.log(task.assignee?.email);

// Create a time entry
const { data: entry } = await p.time.create({
  person_id: 'person-1',
  service_id: 'service-1',
  date: '2024-01-15',
  time: 60, // minutes
});
```

## Pagination

Use `all()` to automatically iterate across all pages:

```typescript
// Async iteration — memory efficient
for await (const project of p.projects.all()) {
  console.log(project.name);
}

// Or collect everything into an array
const allProjects = await p.projects.all().toArray();

// Pass filters and sort
for await (const task of p.tasks.all({ filter: { closed: 'false' }, sort: '-created_at' })) {
  console.log(task.title);
}
```

## Query Builder

Use `where()` on any collection to start a fluent query builder:

```typescript
// Chainable filtering, sorting, includes, and pagination
const { data: tasks } = await p.tasks
  .where({ project_id: '42' })
  .orderBy('-due_date')
  .include('project', 'assignee')
  .perPage(50)
  .list();

// Combine with pagination
for await (const task of p.tasks.where({ closed: 'false' }).orderBy('title').all()) {
  console.log(task.title);
}

// Raw options still work — where() is fully backward-compatible
const { data } = await p.tasks.list({ filter: { project_id: '42' }, sort: '-due_date' });
```

### Builder Methods

| Method               | Description                                    |
| -------------------- | ---------------------------------------------- |
| `where(filters?)`    | Start builder with optional initial filters    |
| `.filter(filters)`   | Merge additional filters                       |
| `.orderBy(field)`    | Set sort field (`-field` for descending)       |
| `.include(...paths)` | Add include paths (deduplicated)               |
| `.page(n)`           | Set page number                                |
| `.perPage(n)`        | Set items per page                             |
| `.list()`            | Execute and return paginated result            |
| `.all()`             | Execute and return `AsyncPaginatedIterator`    |
| `.build()`           | Return the raw options object (for inspection) |

## Error Handling

All collection methods wrap API errors into typed `ProductiveError` subclasses, enabling `instanceof` checks instead of string matching:

```typescript
import {
  ResourceNotFoundError,
  RateLimitError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  isProductiveError,
} from '@studiometa/productive-sdk';

try {
  await p.tasks.get(taskId);
} catch (e) {
  if (e instanceof ResourceNotFoundError) {
    console.log(`Task not found (${e.statusCode})`);
  }
  if (e instanceof RateLimitError) {
    console.log(`Rate limited, retry in ${e.retryAfter}s`);
  }
  if (e instanceof ValidationError) {
    for (const err of e.fieldErrors) {
      console.log(`${err.field}: ${err.message}`); // e.g. "title: is required"
    }
  }
  if (e instanceof AuthenticationError) {
    console.log(`Auth failed (${e.statusCode})`); // 401 or 403
  }
  if (e instanceof NetworkError) {
    console.log(`Network error: ${e.cause.message}`);
  }
}

// Or use the type guard
if (isProductiveError(e)) {
  console.log(e.statusCode); // available on all ProductiveError subclasses
}
```

### Error Classes

| Class                   | Status Code | Properties                                 |
| ----------------------- | ----------- | ------------------------------------------ |
| `ProductiveError`       | any         | `statusCode?`                              |
| `ResourceNotFoundError` | 404         | `resourceType?`, `resourceId?`             |
| `RateLimitError`        | 429         | `retryAfter?`                              |
| `ValidationError`       | 422         | `fieldErrors: { field, message, code? }[]` |
| `AuthenticationError`   | 401 / 403   | —                                          |
| `NetworkError`          | —           | `cause: Error`                             |

## API Reference

### `new Productive(options)`

| Option           | Type     | Required | Description                                |
| ---------------- | -------- | -------- | ------------------------------------------ |
| `token`          | `string` | ✓        | Productive.io API token                    |
| `organizationId` | `string` | ✓        | Your organization ID                       |
| `userId`         | `string` | —        | Current user ID (needed for `people.me()`) |

### Collections

Each collection exposes a consistent API:

| Method              | Description                                       |
| ------------------- | ------------------------------------------------- |
| `list(options?)`    | Paginated list                                    |
| `get(id, options?)` | Single resource                                   |
| `create(data)`      | Create resource _(tasks, time, companies, deals)_ |
| `update(id, data)`  | Update resource _(tasks, time, companies, deals)_ |
| `delete(id)`        | Delete resource _(time entries only)_             |
| `all(options?)`     | `AsyncPaginatedIterator` over all pages           |
| `me()`              | Current user _(people only, requires `userId`)_   |

### Include Resolution

When you pass `include` options, related resources are automatically resolved from the `included` array and inlined:

```typescript
// Without SDK: manual lookup required
const response = await api.getTasks({ include: ['project'] });
const task = response.data[0];
const projectId = task.relationships.project.data?.id;
const project = response.included?.find((r) => r.id === projectId && r.type === 'projects');

// With SDK: automatically inlined
const { data: tasks } = await p.tasks.list({ include: ['project'] });
const task = tasks[0];
console.log(task.project?.name); // resolved directly
```

## Testing

Since `ProductiveApi` uses `globalThis.fetch`, mock it with `vi.stubGlobal`:

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Productive } from '@studiometa/productive-sdk';

describe('my feature', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ id: '1', type: 'projects', attributes: { name: 'Test' }, relationships: {} }],
            meta: { total_pages: 1 },
          }),
          { status: 200 },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists projects', async () => {
    const p = new Productive({ token: 'test', organizationId: 'org' });
    const { data } = await p.projects.list();
    expect(data[0].name).toBe('Test');
  });
});
```

## Architecture

```
@studiometa/productive-sdk  → @studiometa/productive-api
@studiometa/productive-api  → (nothing)
```

The SDK has a single runtime dependency on `productive-api` and adds zero side effects.
