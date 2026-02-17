# @studiometa/productive-core

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-core?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

Shared business logic for Productive.io tools. Provides pure executor functions with injectable dependencies for testability.

## Architecture

### Executors

Pure functions with the signature `(options, context) → ExecutorResult<T>`. No I/O side effects — all dependencies are injected via `ExecutorContext`.

```typescript
import { listTasks, createTestExecutorContext } from '@studiometa/productive-core';

// In production — context is created from CLI or MCP context
const result = await listTasks({ projectId: '123', status: 'open' }, executorContext);

// In tests — mock only what you need
const ctx = createTestExecutorContext({
  api: { getTasks: vi.fn().mockResolvedValue(mockResponse) },
});
const result = await listTasks({ projectId: '123' }, ctx);
```

### Available Executors

| Resource    | Operations                        |
| ----------- | --------------------------------- |
| `time`      | list, get, create, update, delete |
| `projects`  | list, get                         |
| `people`    | list, get                         |
| `services`  | list                              |
| `companies` | list, get, create, update         |
| `tasks`     | list, get, create, update         |
| `deals`     | list, get, create, update         |
| `bookings`  | list, get, create, update         |
| `comments`  | list, get, create, update         |
| `timers`    | list, get, start, stop            |
| `budgets`   | list                              |
| `reports`   | get (11 report types)             |

### Context Bridges

Adapters for creating `ExecutorContext` from CLI or MCP contexts:

```typescript
import { fromCommandContext } from '@studiometa/productive-core';

// CLI handler
const execCtx = fromCommandContext(ctx);
const result = await listTimeEntries(options, execCtx);
```

```typescript
import { fromHandlerContext } from '@studiometa/productive-core';

// MCP handler
const execCtx = fromHandlerContext(ctx, resolveFns);
const result = await listTimeEntries(options, execCtx);
```

### Key Types

```typescript
interface ExecutorContext {
  api: ProductiveApi;
  resolver: ResourceResolver;
  config: { userId?: string; organizationId: string };
}

interface ExecutorResult<T> {
  data: T;
  meta?: JsonApiMeta;
  included?: IncludedResource[];
  resolved?: Record<string, unknown>;
}
```

## License

MIT © [Studio Meta](https://www.studiometa.fr)
