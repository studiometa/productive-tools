# Claude Instructions

Instructions for AI agents contributing to this codebase.

## Git & Commits

- Commit messages: English, simple verb-first sentences (e.g., "Add...", "Fix...", "Update...")
- Always add `Co-authored-by: Claude <claude@anthropic.com>` trailer
- **Tags**: Do NOT use `v` prefix (use `0.4.0` not `v0.4.0`)
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
- All 4 packages share the same version (synced by `scripts/sync-versions.js` at publish time)

## Architecture

4-package monorepo with clean dependency layering:

```
productive-api   → (nothing)          # types, API client, formatters
productive-core  → productive-api     # executors with dependency injection
productive-cli   → productive-core    # CLI commands, renderers, config+cache
productive-mcp   → productive-core    # MCP server handlers, OAuth
                 → productive-api
```

### Package Responsibilities

- **productive-api** (`packages/api`): `ProductiveApi` class (explicit config injection), resource types (`ProductiveProject`, `ProductiveTimeEntry`, etc.), response formatters, `ProductiveApiError`, `ApiCache` interface. Zero dependencies.
- **productive-core** (`packages/core`): Pure executor functions `(options, context) → ExecutorResult<T>`, `ExecutorContext` with DI, `createResourceResolver()` factory, bridge functions (`fromCommandContext`, `fromHandlerContext`).
- **productive-cli** (`packages/cli`): CLI commands (one directory per resource under `src/commands/`), human/table/CSV/JSON renderers, keychain config, SQLite cache, `CommandContext` for DI.
- **productive-mcp** (`packages/mcp`): Single unified `productive` MCP tool, resource handlers, OAuth (stateless), HTTP server, MCP-specific formatters.

### Key Design Principles

- **Executors are pure functions with zero side effects** — all dependencies injected via `ExecutorContext`. Tests use `createTestExecutorContext()`.
- **Resource resolution** (email → person ID, project number → project ID) is handled by `createResourceResolver()` in core. Bridge functions create a resolver automatically — CLI/MCP handlers just call `fromCommandContext(ctx)` or `fromHandlerContext(ctx)`.
- **Build order matters**: `productive-api` → `productive-core` → `productive-cli` / `productive-mcp`. The root `npm run build` handles this automatically.

## Testing Rules

These rules are **mandatory** for all code in this monorepo:

1. **Each package must have its own test suite approaching 100% coverage.** Every source file must have corresponding tests.

2. **Dependency injection over mocking.** Prefer DI instead of `vi.mock()` wherever possible. Acceptable uses of `vi.mock()`: mocking Node.js built-ins (`node:fs`, `node:os`) or third-party modules that don't support DI.
   - **productive-core**: Use `createTestExecutorContext()` — never mock modules.
   - **productive-cli**: Use `createTestContext()` with mock API/config/cache — test handler functions directly.
   - **productive-api**: Use constructor injection (`new ProductiveApi({ config, fetch, cache })`) — mock the `fetch` function.

3. **File system operations must be mocked.** Never read/write real user files in tests.

4. **Test file conventions:** Tests are colocated with source files: `foo.ts` → `foo.test.ts` in the same directory. CLI command tests live in their respective `src/commands/<resource>/` directory.

5. **No real API calls in tests.** All HTTP requests must be mocked via DI (injected `fetch`) or mock API objects.

After changing `productive-core` source, rebuild before running CLI/MCP tests:

```bash
npm run build -w @studiometa/productive-core
```
