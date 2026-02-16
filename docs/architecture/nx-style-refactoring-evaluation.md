# Nx-Style Architecture Evaluation for productive-tools

This document evaluates how an Nx-style executor/generator pattern would look for the entire productive-tools project.

## Executive Summary

The Nx pattern separates:

1. **Input parsing** (CLI/MCP layer) - transforms raw args into typed options
2. **Business logic** (Executors) - pure functions with explicit dependencies
3. **Side effects** (Context) - API calls, file I/O, output

This would significantly improve testability but requires substantial refactoring.

---

## Current Architecture

### CLI Package Structure

```
packages/productive-cli/src/
├── commands/
│   ├── time/
│   │   ├── command.ts      # CLI parsing (yargs-like)
│   │   ├── handlers.ts     # Business logic + side effects (mixed)
│   │   ├── help.ts         # Help text
│   │   └── index.ts        # Exports
│   ├── tasks/
│   ├── projects/
│   └── ...
├── context.ts              # CommandContext (partial DI)
├── api.ts                  # ProductiveApi
└── formatters/             # Output formatting
```

### MCP Package Structure

```
packages/productive-mcp/src/
├── handlers/
│   ├── time.ts            # Handler with business logic
│   ├── tasks.ts
│   ├── resolve.ts
│   └── types.ts           # HandlerContext
├── formatters.ts
└── index.ts
```

### Current Pain Points

1. **Handlers mix concerns**: Filter building, resolution, API calls, and output formatting are all in one function
2. **Hard to test resolution**: `resolveCommandFilters()` is called inside handlers, can't be mocked without module mocking
3. **Duplicate logic**: Similar patterns in CLI and MCP (filter building, resolution)
4. **Context is incomplete**: `CommandContext` doesn't include resolution functions

---

## Proposed Nx-Style Architecture

### Core Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI / MCP Layer                          │
│  Parses raw input → Typed Options                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Executor Layer                           │
│  Pure business logic functions                                   │
│  Input: ExecutorOptions + ExecutorContext                       │
│  Output: ExecutorResult                                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Context Layer                            │
│  All dependencies injected: API, resolver, formatter, etc.      │
└─────────────────────────────────────────────────────────────────┘
```

### New Package Structure

```
packages/
├── productive-core/                    # NEW: Shared business logic
│   └── src/
│       ├── executors/
│       │   ├── time/
│       │   │   ├── list.ts            # listTimeEntries executor
│       │   │   ├── create.ts          # createTimeEntry executor
│       │   │   ├── update.ts          # updateTimeEntry executor
│       │   │   └── types.ts           # TimeListOptions, TimeCreateOptions
│       │   ├── tasks/
│       │   ├── projects/
│       │   └── index.ts
│       ├── context/
│       │   ├── types.ts               # ExecutorContext interface
│       │   ├── create.ts              # createExecutorContext()
│       │   └── testing.ts             # createTestContext()
│       ├── resolvers/
│       │   ├── resource-resolver.ts   # Core resolution logic
│       │   └── types.ts               # Resolver interface
│       └── index.ts
│
├── productive-cli/                     # CLI adapter
│   └── src/
│       ├── commands/
│       │   ├── time/
│       │   │   ├── command.ts         # CLI parsing only
│       │   │   ├── adapter.ts         # Maps CLI args → executor
│       │   │   └── index.ts
│       │   └── ...
│       ├── context/
│       │   └── cli-context.ts         # CLI-specific context creation
│       └── index.ts
│
├── productive-mcp/                     # MCP adapter
│   └── src/
│       ├── handlers/
│       │   ├── time.ts                # Maps MCP args → executor
│       │   └── ...
│       ├── context/
│       │   └── mcp-context.ts         # MCP-specific context creation
│       └── index.ts
```

---

## Detailed Design

### 1. ExecutorContext Interface

```typescript
// packages/productive-core/src/context/types.ts

import type { ProductiveApi } from './api.js';
import type { ResourceResolver } from '../resolvers/types.js';

/**
 * Context containing all dependencies for executors.
 * Similar to Nx's ExecutorContext but tailored for Productive API.
 */
export interface ExecutorContext {
  /** API client for Productive */
  readonly api: ProductiveApi;

  /** Resource resolver for human-friendly IDs */
  readonly resolver: ResourceResolver;

  /** Organization ID (for caching) */
  readonly organizationId: string;

  /** Current user ID (for --mine filters) */
  readonly userId?: string;

  /** Logger for debug output */
  readonly logger: Logger;
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Result from an executor - always returns data, never handles output
 */
export interface ExecutorResult<T> {
  success: boolean;
  data?: T;
  error?: ExecutorError;
  metadata?: {
    resolved?: Record<string, ResolvedInfo>;
    pagination?: PaginationMeta;
  };
}

export interface ExecutorError {
  code: string;
  message: string;
  details?: unknown;
}
```

### 2. Executor Example: Time List

```typescript
// packages/productive-core/src/executors/time/list.ts

import type { ExecutorContext, ExecutorResult } from '../../context/types.js';
import type { TimeEntry } from '../../types.js';

/**
 * Options for listing time entries.
 * Pure data - no CLI/MCP specifics.
 */
export interface TimeListOptions {
  // Date filtering
  dateRange?: { from: string; to: string };

  // Resource filtering (can be IDs or human-friendly values)
  personId?: string;
  projectId?: string;
  serviceId?: string;
  taskId?: string;
  companyId?: string;
  dealId?: string;

  // Status filtering
  status?: 'approved' | 'unapproved' | 'rejected';
  billingType?: 'fixed' | 'actuals' | 'non_billable';

  // Pagination
  page?: number;
  perPage?: number;
  sort?: string;
}

export interface TimeListResult {
  entries: TimeEntry[];
  meta: {
    page: number;
    perPage: number;
    total: number;
  };
}

/**
 * List time entries executor.
 *
 * Pure function: takes options + context, returns result.
 * No side effects, no output formatting.
 */
export async function listTimeEntries(
  options: TimeListOptions,
  context: ExecutorContext,
): Promise<ExecutorResult<TimeListResult>> {
  const { api, resolver, logger } = context;

  logger.debug('listTimeEntries called with options:', options);

  // Build API filter from options
  const filter: Record<string, string> = {};
  const resolvedMeta: Record<string, ResolvedInfo> = {};

  // Date range
  if (options.dateRange) {
    filter.after = options.dateRange.from;
    filter.before = options.dateRange.to;
  }

  // Resolve person ID if needed
  if (options.personId) {
    const resolved = await resolver.tryResolve(options.personId, 'person');
    filter.person_id = resolved.id;
    if (resolved.wasResolved) {
      resolvedMeta.person_id = resolved;
    }
  }

  // Resolve project ID if needed
  if (options.projectId) {
    const resolved = await resolver.tryResolve(options.projectId, 'project');
    filter.project_id = resolved.id;
    if (resolved.wasResolved) {
      resolvedMeta.project_id = resolved;
    }
  }

  // ... similar for other filters

  // Status mapping
  if (options.status) {
    const statusMap = { approved: '1', unapproved: '2', rejected: '3' };
    filter.status = statusMap[options.status];
  }

  // Call API
  const response = await api.getTimeEntries({
    filter,
    page: options.page ?? 1,
    perPage: options.perPage ?? 100,
    sort: options.sort,
  });

  return {
    success: true,
    data: {
      entries: response.data,
      meta: {
        page: response.meta.current_page,
        perPage: response.meta.page_size,
        total: response.meta.total_count,
      },
    },
    metadata: {
      resolved: Object.keys(resolvedMeta).length > 0 ? resolvedMeta : undefined,
      pagination: response.meta,
    },
  };
}
```

### 3. Resolver Interface

```typescript
// packages/productive-core/src/resolvers/types.ts

export type ResolvableType = 'person' | 'project' | 'service' | 'task' | 'company' | 'deal';

export interface ResolvedInfo {
  input: string;
  id: string;
  label: string;
  wasResolved: boolean;
  exact: boolean;
}

/**
 * Resource resolver interface.
 * Implementations can be real (API-backed) or mock (for testing).
 */
export interface ResourceResolver {
  /**
   * Try to resolve a value. Returns the original if resolution fails.
   */
  tryResolve(
    value: string,
    type: ResolvableType,
    options?: { projectId?: string },
  ): Promise<ResolvedInfo>;

  /**
   * Resolve a value. Throws if resolution fails.
   */
  resolve(
    value: string,
    type: ResolvableType,
    options?: { projectId?: string },
  ): Promise<ResolvedInfo>;

  /**
   * Resolve multiple filter values at once.
   */
  resolveFilters(
    filters: Record<string, string>,
    typeMapping?: Record<string, ResolvableType>,
  ): Promise<{
    resolved: Record<string, string>;
    metadata: Record<string, ResolvedInfo>;
  }>;
}
```

### 4. CLI Adapter

```typescript
// packages/productive-cli/src/commands/time/adapter.ts

import type { CommandContext } from '../../context.js';
import { listTimeEntries, type TimeListOptions } from '@productive/core';
import { parseDateRange } from '../../utils/date.js';

/**
 * Adapts CLI options to executor options.
 * This is the only place that knows about CLI-specific things.
 */
export function buildTimeListOptions(ctx: CommandContext): TimeListOptions {
  const { options, config } = ctx;

  const result: TimeListOptions = {
    page: ctx.getPagination().page,
    perPage: ctx.getPagination().perPage,
    sort: ctx.getSort() || undefined,
  };

  // Date handling (CLI-specific parsing)
  if (options.date) {
    result.dateRange = parseDateRange(String(options.date));
  }
  if (options.from || options.to) {
    result.dateRange = {
      from: options.from ? String(options.from) : (result.dateRange?.from ?? ''),
      to: options.to ? String(options.to) : (result.dateRange?.to ?? ''),
    };
  }

  // Person filtering
  if (options.mine && config.userId) {
    result.personId = config.userId;
  } else if (options.person) {
    result.personId = String(options.person);
  }

  // Resource filtering
  if (options.project) result.projectId = String(options.project);
  if (options.service) result.serviceId = String(options.service);
  // ... etc

  return result;
}

/**
 * CLI handler - thin wrapper around executor.
 */
export async function timeList(ctx: CommandContext): Promise<void> {
  const spinner = ctx.createSpinner('Fetching time entries...');
  spinner.start();

  try {
    // Build executor options from CLI options
    const options = buildTimeListOptions(ctx);

    // Create executor context from CLI context
    const executorCtx = createExecutorContext(ctx);

    // Call executor
    const result = await listTimeEntries(options, executorCtx);

    spinner.succeed();

    if (!result.success) {
      ctx.formatter.error(result.error?.message ?? 'Unknown error');
      return;
    }

    // Format and output (CLI-specific)
    const formatted = formatTimeEntryList(result.data!, ctx.formatter.format);
    ctx.formatter.output(formatted);
  } catch (error) {
    spinner.fail();
    throw error;
  }
}
```

### 5. MCP Adapter

```typescript
// packages/productive-mcp/src/handlers/time.ts

import type { HandlerContext, ToolResult } from './types.js';
import { listTimeEntries, type TimeListOptions } from '@productive/core';
import { jsonResult } from './utils.js';

/**
 * Adapts MCP args to executor options.
 */
function buildTimeListOptions(args: CommonArgs, ctx: HandlerContext): TimeListOptions {
  return {
    personId: args.person_id,
    projectId: args.project_id,
    serviceId: args.service_id,
    dateRange: args.after && args.before ? { from: args.after, to: args.before } : undefined,
    page: ctx.page,
    perPage: ctx.perPage,
  };
}

export async function handleTime(
  action: string,
  args: CommonArgs,
  ctx: HandlerContext,
): Promise<ToolResult> {
  if (action === 'list') {
    const options = buildTimeListOptions(args, ctx);
    const executorCtx = createExecutorContext(ctx);

    const result = await listTimeEntries(options, executorCtx);

    if (!result.success) {
      return errorResult(result.error!);
    }

    // MCP-specific formatting
    const formatted = formatForMcp(result.data!, ctx.formatOptions);

    // Include resolution metadata if any
    if (result.metadata?.resolved) {
      formatted._resolved = result.metadata.resolved;
    }

    return jsonResult(formatted);
  }

  // ... other actions
}
```

### 6. Testing

```typescript
// packages/productive-core/src/executors/time/__tests__/list.test.ts

import { describe, it, expect, vi } from 'vitest';
import { listTimeEntries, type TimeListOptions } from '../list.js';
import { createTestContext } from '../../../context/testing.js';

describe('listTimeEntries', () => {
  it('resolves email to person ID', async () => {
    const mockApi = {
      getTimeEntries: vi.fn().mockResolvedValue({
        data: [{ id: '123', attributes: { date: '2024-01-15' } }],
        meta: { current_page: 1, page_size: 100, total_count: 1 },
      }),
    };

    const mockResolver = {
      tryResolve: vi.fn().mockResolvedValue({
        input: 'john@example.com',
        id: '500521',
        label: 'John Doe',
        wasResolved: true,
        exact: true,
      }),
    };

    const ctx = createTestContext({
      api: mockApi,
      resolver: mockResolver,
    });

    const options: TimeListOptions = {
      personId: 'john@example.com',
    };

    const result = await listTimeEntries(options, ctx);

    expect(result.success).toBe(true);
    expect(mockResolver.tryResolve).toHaveBeenCalledWith('john@example.com', 'person');
    expect(mockApi.getTimeEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { person_id: '500521' },
      }),
    );
    expect(result.metadata?.resolved?.person_id).toEqual({
      input: 'john@example.com',
      id: '500521',
      label: 'John Doe',
      wasResolved: true,
      exact: true,
    });
  });

  it('passes through numeric IDs without resolution', async () => {
    const mockApi = {
      getTimeEntries: vi.fn().mockResolvedValue({
        data: [],
        meta: { current_page: 1, page_size: 100, total_count: 0 },
      }),
    };

    const mockResolver = {
      tryResolve: vi.fn().mockResolvedValue({
        input: '500521',
        id: '500521',
        label: '500521',
        wasResolved: false,
        exact: true,
      }),
    };

    const ctx = createTestContext({
      api: mockApi,
      resolver: mockResolver,
    });

    const result = await listTimeEntries({ personId: '500521' }, ctx);

    expect(result.success).toBe(true);
    expect(result.metadata?.resolved).toBeUndefined();
  });
});
```

---

## Migration Strategy

### Phase 1: Create productive-core package (Week 1-2)

1. Create new `packages/productive-core` package
2. Define `ExecutorContext` and `ResourceResolver` interfaces
3. Move `resource-resolver.ts` to core with new interface
4. Create `createTestContext()` for easy testing

### Phase 2: Migrate one command as pilot (Week 2-3)

1. Choose `time` command as pilot
2. Create executors: `listTimeEntries`, `createTimeEntry`, `updateTimeEntry`
3. Create CLI adapter
4. Create MCP adapter
5. Achieve 100% test coverage on executors

### Phase 3: Migrate remaining commands (Week 3-6)

1. Migrate in order of complexity:
   - `projects` (simple CRUD)
   - `people` (simple CRUD)
   - `tasks` (medium complexity)
   - `deals` (medium complexity)
   - `bookings` (medium complexity)
   - `reports` (complex)

### Phase 4: Remove old code (Week 6-7)

1. Remove old handlers
2. Update all imports
3. Clean up unused code

---

## Impact Assessment

### Benefits

| Benefit             | Impact                                                     |
| ------------------- | ---------------------------------------------------------- |
| **Testability**     | 100% unit test coverage possible without mocks             |
| **Code reuse**      | CLI and MCP share same business logic                      |
| **Type safety**     | Explicit option types, no `string \| boolean \| undefined` |
| **Maintainability** | Clear separation of concerns                               |
| **Debugging**       | Easier to trace issues through layers                      |

### Costs

| Cost                   | Effort                                      |
| ---------------------- | ------------------------------------------- |
| **New package**        | ~2 days setup                               |
| **Executor migration** | ~1 day per command (12 commands = 12 days)  |
| **Adapter creation**   | ~0.5 day per command (12 commands = 6 days) |
| **Test rewriting**     | ~1 day per command (12 commands = 12 days)  |
| **Documentation**      | ~2 days                                     |
| **Total**              | ~34 developer days                          |

### Risk Assessment

| Risk             | Mitigation                        |
| ---------------- | --------------------------------- |
| Breaking changes | Keep old code until new is stable |
| Learning curve   | Document patterns thoroughly      |
| Scope creep      | Strict phase boundaries           |

---

## Comparison: Option 2 vs Option 3

| Aspect                        | Option 2 (DI on Context) | Option 3 (Nx-style) |
| ----------------------------- | ------------------------ | ------------------- |
| **Effort**                    | ~2-3 days                | ~34 days            |
| **Testability improvement**   | Good (80%)               | Excellent (100%)    |
| **Code reuse**                | Minimal                  | Maximum             |
| **Breaking changes**          | None                     | Significant         |
| **Long-term maintainability** | Good                     | Excellent           |

---

## Recommendation

**For immediate PR #23 needs**: Implement **Option 2** (add `resolveFilters` and `resolveValue` to `CommandContext`)

**For long-term architecture**: Consider **Option 3** (Nx-style) as a separate initiative after the smart-id-resolution feature is merged and stable.

The Nx-style refactoring is the right direction for the project's evolution, but it's a significant undertaking that should be planned as a dedicated refactoring sprint, not mixed with feature development.
