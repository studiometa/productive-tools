# @studiometa/productive-core

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

### Available executors

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
| `reports`   | get (all 11 report types)         |

### Context bridges

Adapters for creating `ExecutorContext` from existing CLI/MCP contexts:

```typescript
import { fromCommandContext } from '@studiometa/productive-core';

// CLI handler
export async function timeList(ctx: CommandContext) {
  const execCtx = fromCommandContext(ctx);
  const result = await listTimeEntries(options, execCtx);
  // handle output...
}
```

```typescript
import { fromHandlerContext } from '@studiometa/productive-core';

// MCP handler
export async function handleTime(action, args, ctx: HandlerContext) {
  const execCtx = fromHandlerContext(ctx, resolveFns);
  const result = await listTimeEntries(options, execCtx);
  return jsonResult(formatListResponse(result.data, ...));
}
```

### Key types

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

## Testing

```bash
npm test           # Run tests
npm run test:ci    # Run with coverage
```

## License

MIT © [Studio Meta](https://www.studiometa.fr/)
