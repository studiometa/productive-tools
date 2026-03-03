# Claude Instructions

Instructions for AI agents contributing to this codebase.

## Git & Commits

<!-- Commit format, Co-authored-by trailer, and tag prefix rules are enforced by git hooks:
     .husky/commit-msg → scripts/check-commit-msg.sh
     .husky/pre-push   → rejects v-prefixed tags -->

- **Releases**: Do NOT create GitHub releases manually — they are created automatically by GitHub Actions when a tag is pushed

## Changelog

- **Single changelog** at root (`CHANGELOG.md`) for the entire monorepo
- Prefix entries with package name when relevant: `**CLI**: ...`, `**MCP**: ...`, `**API**: ...`, `**Core**: ...`
- Use `[hash]` format for commit references (not bare hashes)
- Use `[#N]` format for PR references (GitHub style, not `!N` GitLab style)
- Add link definitions at the end of each release section (not in a shared footer):
  - Version: `[X.Y.Z]: https://github.com/studiometa/productive-tools/compare/prev...X.Y.Z`
  - Commits: `[hash]: https://github.com/studiometa/productive-tools/commit/hash`
  - PRs: `[#N]: https://github.com/studiometa/productive-tools/pull/N`
- Keep entries concise, single line with references at the end

## Versioning

- Use root npm scripts to bump version across all packages:
  - `npm run version:patch` — bump patch (e.g., 0.8.5 → 0.8.6)
  - `npm run version:minor` — bump minor (e.g., 0.8.5 → 0.9.0)
  - `npm run version:major` — bump major (e.g., 0.8.5 → 1.0.0)
- These scripts update version in root and all workspace packages simultaneously
- Version is injected at build time from package.json (no manual sync needed)
- All 5 packages share the same version (synced by `scripts/sync-versions.js` at publish time)

## Architecture

5-package monorepo with clean dependency layering:

```
productive-api   → (nothing)          # types, API client, formatters, rate limiter
productive-core  → productive-api     # executors with dependency injection
productive-sdk   → productive-api     # fluent TypeScript SDK, JSON:API resolver, pagination
productive-cli   → productive-core    # CLI commands, renderers, config+cache
productive-mcp   → productive-core    # MCP server handlers, OAuth
                 → productive-api
```

### Package Responsibilities

- **productive-api** (`packages/api`): `ProductiveApi` class (explicit config injection), resource types (`ProductiveProject`, `ProductiveTimeEntry`, etc.), response formatters, `ProductiveApiError`, `ApiCache` interface, `RateLimiter` (sliding window + exponential backoff). Zero dependencies.
- **productive-core** (`packages/core`): Pure executor functions `(options, context) → ExecutorResult<T>`, `ExecutorContext` with DI, `createResourceResolver()` factory, bridge functions (`fromCommandContext`, `fromHandlerContext`), context executors (task/project/deal), summary executors (my_day, project_health, team_pulse), workflow executors (complete_task, log_day, weekly_standup), activity executor.
- **productive-sdk** (`packages/sdk`): Fluent TypeScript SDK wrapping `ProductiveApi`. JSON:API include resolver (resolves `included` array into inlined relationships), `AsyncPaginatedIterator` for `for await` pagination, resource collections (projects, tasks, time, people, companies, custom fields, deals, services, comments, timers, discussions, bookings, pages, attachments, activities). Zero side effects, testable via `globalThis.fetch` mocking.
- **productive-cli** (`packages/cli`): CLI commands (one directory per resource under `src/commands/`), `createCommandRouter()` factory, human/table/CSV/JSON renderers, keychain config, SQLite cache, `CommandContext` for DI. Includes `activities` command for audit log.
- **productive-mcp** (`packages/mcp`): Single unified `productive` MCP tool, `createResourceHandler()` factory, resource handlers, contextual hints (`hints.ts`), proactive suggestions (`suggestions.ts`), agent instructions (`instructions.ts` loads from `skills/SKILL.md`), batch/search/schema/context/summaries/workflows handlers, input validation (params detection, include validation, wrong-action redirects), OAuth (stateless), HTTP server, MCP-specific formatters.

### Centralized Constants

`productive-core/src/constants.ts` is the **single source of truth** for `RESOURCES`, `ACTIONS`, and `REPORT_TYPES` arrays. Both MCP and CLI derive from these:

- **MCP `schema.ts`** — Zod validation schemas use `z.enum(RESOURCES)`, `z.enum(ACTIONS)`, etc.
- **MCP `tools.ts`** — the MCP tool `inputSchema` enums and `description` are generated from the constants.
- **MCP `handlers/index.ts`** — `VALID_RESOURCES` derives from `RESOURCES`.
- **Core `reports/types.ts`** — `ReportType` type and `VALID_REPORT_TYPES` derive from `REPORT_TYPES`.

**When adding a new resource, action, or report type**, update `core/src/constants.ts` — it automatically propagates to validation, tool definition, and handler routing.

### Key Design Principles

- **Executors are pure functions with zero side effects** — all dependencies injected via `ExecutorContext`. Tests use `createTestExecutorContext()`.
- **Resource resolution** (email → person ID, project number → project ID) is handled by `createResourceResolver()` in core. Bridge functions create a resolver automatically — CLI/MCP handlers just call `fromCommandContext(ctx)` or `fromHandlerContext(ctx)`.
- **Build order matters**: `productive-api` → `productive-core` / `productive-sdk` → `productive-cli` / `productive-mcp`. The root `npm run build` handles this automatically.

## Factory Patterns

Both CLI and MCP use factory patterns to eliminate boilerplate. **Always use these factories** when adding new resources or handlers.

### MCP: `createResourceHandler()` (`packages/mcp/src/handlers/factory.ts`)

Encapsulates the standard list/get/create/update/delete/resolve cycle. All CRUD-style MCP handlers use this factory.

```typescript
// Example: packages/mcp/src/handlers/tasks.ts
export const handleTasks = createResourceHandler<TaskArgs>({
  resource: 'tasks',
  displayName: 'task',
  actions: ['list', 'get', 'create', 'update', 'resolve', 'context'],
  formatter: formatTask,
  hints: (data, id) => getTaskHints(id, data.relationships?.service?.data?.id),
  supportsResolve: true,
  resolveArgsFromArgs: (args) => ({ project_id: args.project_id }),
  defaultInclude: { list: ['project', 'project.company'], get: ['project', 'project.company'] },
  create: {
    required: ['title', 'project_id', 'task_list_id'],
    mapOptions: (args) => ({ title: args.title, projectId: args.project_id, ... }),
  },
  update: {
    mapOptions: (args) => ({ title: args.title, description: args.description, ... }),
  },
  customActions: {
    context: async (args, ctx, execCtx) => { /* custom context logic */ },
  },
  executors: { list: listTasks, get: getTask, create: createTask, update: updateTask },
});
```

Key factory options:

- **`customActions`** — handler functions for non-CRUD actions (e.g., `context`, `start`/`stop`, `reopen`)
- **`listFilterFromArgs`** — extract extra filters from args (e.g., `person_id`, `task_id` from tool args)
- **`resolveArgsFromArgs`** — extra args for `handleResolve` (e.g., `project_id` for scoped resolution)
- **`create.validateArgs`** — custom validation returning `ToolResult` on error
- **`defaultInclude`** — default `include` arrays merged with user-provided includes

**Non-factory handlers**: `batch.ts`, `search.ts`, `summaries.ts`, `reports.ts`, `workflows.ts` have custom logic that doesn't fit the factory pattern. These are standalone handler functions.

### CLI: `createCommandRouter()` (`packages/cli/src/utils/command-router.ts`)

Routes subcommands to handler functions, eliminating switch/case boilerplate:

```typescript
// Example: packages/cli/src/commands/tasks/command.ts
export const handleTasksCommand = createCommandRouter({
  resource: 'tasks',
  handlers: {
    list: tasksList,
    ls: tasksList, // alias
    get: [tasksGet, 'args'], // handler receives args[]
    add: tasksAdd,
    create: tasksAdd, // alias
    update: [tasksUpdate, 'args'],
  },
});
```

Handler types:

- **`ListHandler`** — `(ctx: CommandContext) => Promise<void>` — for list-style commands
- **`ArgsHandler`** — `(args: string[], ctx: CommandContext) => Promise<void>` — marked with `[handler, 'args']`

## MCP Capabilities

The MCP server exposes a **single `productive` tool** with resource/action routing. Beyond basic CRUD, several advanced features exist:

### Agent Discovery

- **`action=help`** — returns detailed documentation for any resource (filters, fields, includes, examples). `handleHelpOverview()` provides a global overview with `_tip` hints.
- **`action=schema`** — returns compact, machine-readable resource specs optimized for LLM consumption (no prose, just actions/filters/fields/includes).

### Rich Context (single-call fetching)

- **`action=context`** on `tasks`, `projects`, `deals` — fetches the resource plus all related data (comments, time entries, subtasks/services) via parallel API calls. Implemented as `customActions` on the factory handler, backed by context executors in core (`packages/core/src/executors/{tasks,projects,deals}/context.ts`).

### Dashboard Summaries

- **`resource=summaries`** — standalone handler (not factory-based) with 3 actions:
  - `my_day` — personal dashboard (tasks, time logged today, active timers)
  - `project_health` — project status with budget burn and task stats (requires `project_id`)
  - `team_pulse` — team-wide time tracking activity for today
- Backed by executors in `packages/core/src/executors/summaries/`.

### Batch & Search

- **`resource=batch action=run`** — executes up to 10 operations in parallel with per-operation error isolation. Returns `{ _batch: { total, succeeded, failed }, results: [...] }`.
- **`resource=search action=run`** — cross-resource text search (projects, companies, people, tasks simultaneously).

### Compound Workflows

- **`resource=workflows`** — standalone handler (not factory-based) with 3 compound actions:
  - `complete_task` — marks task closed, posts optional comment, stops running timers. Partial failures reported in `errors` array.
  - `log_day` — creates multiple time entries in parallel from a structured `entries` array.
  - `weekly_standup` — fetches completed tasks, time logged (grouped by project), and upcoming deadlines for a week.
- Backed by executors in `packages/core/src/executors/workflows/`.

### Activities (Audit Feed)

- **`resource=activities action=list`** — read-only activity feed from the Productive.io `/activities` endpoint.
- Supports filters: `event` (create/update/delete), `after` (ISO timestamp), `person_id`, `project_id`.
- Default include: `creator`. Note: `subject` include is NOT supported by the API (returns 400).
- Full stack: API type + client method → core executor → MCP factory handler + CLI command.
- Changeset formatter converts `[{field: [old, new]}, ...]` to readable `"field: old → new"` strings.

### Contextual Hints (`hints.ts`)

After `get` actions, the response includes a `_hints` object suggesting related resources and common next actions. Example: getting a task suggests fetching its comments, time entries, and attachments.

### Proactive Suggestions (`suggestions.ts`)

Certain responses include `_suggestions: string[]` — data-aware warnings and recommendations computed from response data (no extra API calls). Different from `_hints` (which show related resources).

- `tasks.list` — overdue count, unassigned count
- `tasks.get` — overdue by N days, no time entries (when included)
- `time.list` — total hours logged (or X/8h if filtered by today)
- `summaries.my_day` — no time logged today, timer running too long (>2h)

Controlled by `ctx.includeSuggestions` (separate from `ctx.includeHints`). Both suppressed by `no_hints: true`.

### Input Validation & Helpful Errors

The main handler (`handlers/index.ts`) includes several early-exit validations before routing:

- **`params` wrapper detection** — returns error suggesting `filter` when `params` field is used
- **`include` validation** (`valid-includes.ts`) — checks include values against per-resource whitelist, suggests valid alternatives
- **Wrong resource redirects** — `docs` → `pages`, `budgets` → `deals` with `type=2`
- **Wrong action redirects** — `action=search` on specific resources → suggests `list` with `query` or `resource=search`; `get_*` function-style → suggests proper verbs

The resource routing switch is extracted into `routeToHandler()` to keep cyclomatic complexity manageable.

### Server Instructions (`instructions.ts`)

MCP server instructions are loaded from `packages/mcp/skills/SKILL.md` (stripping YAML frontmatter) and sent to the client during initialization. The CLI also has its own `packages/cli/skills/SKILL.md`.

### Rate Limiting (`packages/api/src/rate-limiter.ts`)

`RateLimiter` class integrated into `ProductiveApi.request()`:

- Sliding window throttling (100 req/10s for regular, 10 req/30s for reports)
- Automatic retry on 429 with exponential backoff + jitter
- `Retry-After` header parsing
- Configurable via `ApiOptions.rateLimit`

## Testing Rules

These rules are **mandatory** for all code in this monorepo:

1. **Each package must have its own test suite approaching 100% coverage.** Every source file must have corresponding tests.

2. **Dependency injection over mocking.** Prefer DI instead of `vi.mock()` wherever possible. Acceptable uses of `vi.mock()`: mocking Node.js built-ins (`node:fs`, `node:os`) or third-party modules that don't support DI.
   - **productive-core**: Use `createTestExecutorContext()` — never mock modules.
   - **productive-cli**: Use `createTestContext()` with mock API/config/cache — test handler functions directly.
   - **productive-api**: Use constructor injection (`new ProductiveApi({ config, fetch, cache })`) — mock the `fetch` function.

3. **File system operations must be mocked.** Never read/write real user files in tests.

4. **Test file conventions:** Tests are colocated with source files: `foo.ts` → `foo.test.ts` in the same directory. CLI command tests live in their respective `src/commands/<resource>/` directory. Run `npm run check:tests` to find missing test files.

5. **No real API calls in tests.** All HTTP requests must be mocked via DI (injected `fetch`) or mock API objects.

After changing `productive-core` source, rebuild before running CLI/MCP tests:

```bash
npm run build -w @studiometa/productive-core
```

### Integration Tests

Sandboxed integration tests live in `tests/integration/` with their own Vitest config:

- **`tests/integration/helpers/`** — `sandbox.ts` (temp dirs), `mock-server.ts` (JSON:API mock), `cli-runner.ts`, `mcp-client.ts`
- **`tests/integration/fixtures/`** — JSON:API response fixtures
- **`PRODUCTIVE_BASE_URL`** env var — redirects API calls to the mock server
- Run: `npm run test:integration` or `npm run test:all` (unit + integration)
- Integration tests use `pool: 'forks'` and `fileParallelism: false` (no port conflicts)

## Common Scripts

```bash
npm run build              # Build all packages (respects dependency order)
npm run test               # Unit tests (all packages via Vitest projects)
npm run test:integration   # Integration tests (sandboxed, mock server)
npm run test:all           # Unit + integration
npm run lint               # oxlint
npm run lint:fix           # oxlint --fix
npm run format             # oxfmt --write
npm run typecheck          # TypeScript check (all workspaces)
npm run check              # All static checks: lint + format + typecheck + test colocation
npm run check:tests        # Report source files missing colocated .test.ts
npm run semgrep            # Security/quality scan
npm run version:patch      # Bump patch version across all packages
npm run version:minor      # Bump minor version
npm run version:major      # Bump major version
```

### Git Hooks (via Husky)

- **pre-commit**: lint-staged (oxlint + oxfmt) + semgrep secrets scan
- **commit-msg**: validates commit format (capitalized verb, no conventional commits, Co-authored-by trailer)
- **pre-push**: rejects v-prefixed tags, then build + test

## Adding a New Resource (step-by-step)

When adding a new Productive.io resource (e.g., `invoices`):

### 1. Constants (`productive-core`)

Add to `packages/core/src/constants.ts`:

- Add `'invoices'` to `RESOURCES` array
- Add any new actions to `ACTIONS` array if needed

### 2. API Types & Client (`productive-api`)

- Add `ProductiveInvoice` type in `packages/api/src/types.ts`
- Add client methods (`getInvoices`, `getInvoice`, etc.) in `packages/api/src/client.ts`
- Add formatter (`formatInvoice`) in `packages/api/src/formatters/`
- Add tests for all new code

### 3. Executors (`productive-core`)

Create `packages/core/src/executors/invoices/`:

- `list.ts`, `get.ts`, `create.ts`, etc. — pure functions `(options, ctx: ExecutorContext) => Promise<ExecutorResult<T>>`
- `types.ts` — options and result types
- `index.ts` — re-exports
- Tests for each executor using `createTestExecutorContext()`
- Export from `packages/core/src/index.ts`

### 4. MCP Handler (`productive-mcp`)

Create `packages/mcp/src/handlers/invoices.ts` using the factory:

```typescript
export const handleInvoices = createResourceHandler<InvoiceArgs>({
  resource: 'invoices',
  actions: ['list', 'get', 'resolve'],
  formatter: formatInvoice,
  executors: { list: listInvoices, get: getInvoice },
  // ... create, update, hints, customActions as needed
});
```

Wire it in `packages/mcp/src/handlers/index.ts`:

- Import `handleInvoices`
- Add `case 'invoices': return handleInvoices(action, args, handlerCtx);`

Add help documentation in `packages/mcp/src/handlers/help.ts`.

### 5. CLI Command (`productive-cli`)

Create `packages/cli/src/commands/invoices/`:

- `handlers.ts` — individual handler functions
- `command.ts` — `createCommandRouter({ resource: 'invoices', handlers: { ... } })`
- `help.ts` — help text
- `index.ts` — re-exports
- Tests for handlers

Wire in `packages/cli/src/cli.ts`.

### 6. Update SKILL.md Files

Update the resource/action tables in:

- `packages/mcp/skills/SKILL.md`
- `packages/cli/skills/SKILL.md`

### 7. Build & Test

```bash
npm run build
npm run test
npm run test:integration    # if you added integration fixtures
```

## Adding a New MCP Action to an Existing Resource

For adding a custom action (e.g., `context` on a new resource):

1. **Core**: Create executor in `packages/core/src/executors/<resource>/context.ts`, export it
2. **Core**: Add the action name to `ACTIONS` in `constants.ts` (if new)
3. **MCP**: Add to the handler's `customActions` in the `createResourceHandler()` config
4. **MCP**: Update the resource's `actions` array in the handler config
5. **MCP**: Update help docs for that resource
6. **Build core** before testing MCP: `npm run build -w @studiometa/productive-core`
