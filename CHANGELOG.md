# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] - 2026-02-18

### Removed

- **All**: Remove `budgets` resource — the Productive.io API has no `/budgets` endpoint, budgets are deals with `type=2` ([898587e], [b1abbed], [#40])
- **API**: Remove `ProductiveBudget` type, `getBudgets()`, `getBudget()` client methods, `formatBudget()` formatter ([898587e], [#40])
- **Core**: Remove `budgets` from `RESOURCES` constant, delete budgets executors ([898587e], [#40])
- **CLI**: Remove `productive budgets` command, renderer, shell completions, productive links ([898587e], [#40])
- **MCP**: Remove budgets handler, hints, and formatter ([898587e], [#40])

### Added

- **CLI**: Add `--budget` flag to `productive deals list` as shortcut for `--type budget` ([898587e], [#40])
- **MCP**: Add helpful redirect error when agents try `resource=budgets` — points to `deals` with `filter[type]=2` ([898587e], [b1abbed], [#40])
- **MCP**: Add `delete` action to time handler — was missing from MCP while available in CLI and core ([6408d3b], [#43])
- **MCP**: Add `resolve` action to help docs for projects, tasks, time, deals, people, companies ([e213594], [#42])
- **MCP**: Document ID resolution patterns in help — `get` descriptions now mention supported formats ([cc3e59e], [#47])
- **MCP**: Extract `createResourceHandler` factory for MCP handlers — refactors projects as proof of concept ([1dff6d8], [#50])
- **CLI**: Extract `createCommandRouter` utility — refactors tasks command as proof of concept ([d273eae], [#49])
- **CLI**: Migrate remaining 13 CLI commands to `createCommandRouter` factory ([5ecb958], [#69], [#67])
- **MCP**: Migrate services, companies, and pages handlers to `createResourceHandler` factory ([c908a2a], [#70], [#68])
- **MCP**: Extend `createResourceHandler` with `customActions`, `listFilterFromArgs`, `resolveArgsFromArgs`, and `validateArgs` ([81a632b], [#72], [#71])
- **MCP**: Migrate deals, tasks, time, attachments, bookings, comments, discussions, and timers handlers to factory ([81a632b], [#72], [#71])
- **MCP**: Add `PRODUCTIVE_BASE_URL` support in HTTP handler — `executeToolWithCredentials` now injects `baseUrl` from env, enabling mock server redirection in integration tests ([dda72b6], [#78])

### Fixed

- **MCP**: Remove false `get` action from services help — no `getService(id)` exists ([832b709], [#41])
- **MCP**: Remove stale budget mocks from handler tests ([11d99ef], [#45])
- **Core**: Add empty-update validation to `updateComment` executor — was missing unlike all other update executors ([d6a2d5f], [#46])
- **CLI**: Remove stale `budgets` from available commands hint in error message ([6eb55c2], [#44])

### Changed

- **CLI**: Deduplicate HTML utility — `stripHtml` now delegates to API's base implementation ([5404334], [#48])

### Tests

- **Integration**: Add end-to-end integration tests for CLI and MCP in a sandboxed environment with a mock Productive.io API — no real API calls ([d630808], [3847568], [090b486], [#78], [#73])
- **CLI**: Add `command.test.ts` routing tests for 12 resources ([a61244c], [#51])
- **CLI**: Add tests for CSV, table, JSON, and kanban renderers ([453cbe4], [#53])
- **CLI**: Improve `cache.ts` test coverage with 53 new test cases ([f775d56], [#52])

## [0.9.2] - 2026-02-17

### Fixed

- **MCP**: Fix tool schema missing `pages`, `discussions`, `budgets`, `attachments` resources and `delete`, `resolve`, `reopen` actions — MCP clients rejected valid resources ([5c982a8], [#37])
- **MCP**: Add missing `page_id`, `parent_page_id`, `comment_id` parameters to tool schema ([5c982a8], [#37])

### Changed

- **Core**: Centralize `RESOURCES`, `ACTIONS`, `REPORT_TYPES` constants as single source of truth in `core/constants.ts` ([56ce4c8], [#37])
- **MCP**: Derive tool schema enums and description from core constants — no more manual sync ([59afd31], [#37])

## [0.9.1] - 2026-02-17

### Fixed

- **API**: Auto-migrate legacy config from `~/.config/` to `~/Library/Application Support/` on macOS ([8ba9e89], [#36])
- **CLI**: Print one-time notice when config migration occurs ([8ba9e89], [#36])
- **API**: Add missing `repository` field in productive-api `package.json` (fixes npm provenance error) ([b68c5f6])
- **API**: Add missing `author` and `keywords` in productive-api `package.json` ([a620069])

## [0.9.0] - 2026-02-17

### Added

- **API**: Add `ProductivePage` and `ProductiveDiscussion` types with full CRUD client methods ([#33])
- **API**: Add `formatPage()` and `formatDiscussion()` formatters ([#33])
- **Core**: Add page executors: `listPages`, `getPage`, `createPage`, `updatePage`, `deletePage` ([#33])
- **Core**: Add discussion executors: `listDiscussions`, `getDiscussion`, `createDiscussion`, `updateDiscussion`, `deleteDiscussion`, `resolveDiscussion`, `reopenDiscussion` ([#33])
- **CLI**: Add `pages` command with `list`, `get`, `create`, `update`, `delete` subcommands ([#33])
- **CLI**: Add `discussions` command with `list`, `get`, `create`, `update`, `delete`, `resolve`, `reopen` subcommands ([#33])
- **MCP**: Add `pages` and `discussions` resource handlers with full CRUD + resolve/reopen ([#33])
- **MCP**: Add `delete`, `resolve`, `reopen` to `ActionSchema` ([#33])
- **API**: Add `ProductiveAttachment` type, `getAttachments()`, `getAttachment()`, `deleteAttachment()` client methods ([#32])
- **API**: Add `formatAttachment()` formatter with human-readable file size ([#32])
- **Core**: Add `listAttachments`, `getAttachment`, `deleteAttachment` executors ([#32])
- **CLI**: Add `attachments` command with `list`, `get`, `delete` subcommands ([#32])
- **MCP**: Add `attachments` resource handler with `list`, `get`, `delete` actions ([#32])
- **MCP**: Add `delete` to `ActionSchema` (also unblocks time entry delete) ([#32])
- **API**: Enrich `ProductiveBudget` type with `name`, `budget_type`, `billable`, dates, `currency` fields ([#34])
- **API**: Add `getBudget(id)` method to `ProductiveApi` client ([#34])
- **Core**: Add `getBudget` executor and enrich `ListBudgetsOptions` with `dealId`, `billable`, `budgetType` filters ([#34])
- **CLI**: Add `budgets get <id>` subcommand with detail renderer ([#34])
- **MCP**: Add `budgets` resource handler with `list` and `get` actions ([#34])
- **Core**: New `@studiometa/productive-core` package with executor architecture ([#25])
  - Pure executor functions `(options, context) → ExecutorResult<T>` for all 12 resource types
  - `ExecutorContext` with dependency injection: `api`, `resolver`, `config`
  - `createTestExecutorContext()` for zero-mock testing
  - `createResourceResolver()` factory with optional cache injection
  - Bridge functions: `fromCommandContext()`, `fromHandlerContext()`
- **API**: New `@studiometa/productive-api` package as foundation layer ([#25])
  - `ProductiveApi` client with explicit config injection (no side effects)
  - All resource types, formatters, `ProductiveApiError`, `ApiCache` interface
  - Shared config, html utils, config-store
- **CLI**: `resolve` command for looking up resources by human-friendly identifiers ([#23])
  - Resolve people by email: `productive resolve "user@example.com"`
  - Resolve projects by number: `productive resolve "PRJ-123"`
  - Resolve companies, deals, services by name
  - `detect` subcommand for debugging pattern detection
  - Quiet mode (`-q`) for scripting: `productive tasks list --assignee $(productive resolve "user@email" -q)`
- **CLI**: Auto-resolution of human-friendly identifiers in all command filters ([#23])
  - `--assignee user@example.com` → resolves email to person ID
  - `--project PRJ-123` → resolves project number to ID
  - `--company "Studio Meta"` → resolves company name to ID
  - Works in tasks, time, services, bookings, projects, people, deals, reports commands
- **MCP**: `resolve` action for finding resources by email, name, or number ([#23])
  - `{ resource: "people", action: "resolve", query: "user@example.com" }`
  - `{ resource: "projects", action: "resolve", query: "PRJ-123" }`
- **MCP**: Auto-resolution in filter parameters for all resources ([#23])
  - `{ filter: { assignee_id: "user@example.com" } }` → resolves automatically
  - Response includes `_resolved` metadata with original input and resolved label
- **MCP**: Auto-resolution in `get` action for ID parameters ([#23])
  - `{ resource: "projects", action: "get", id: "PRJ-123" }` → works directly

### Changed

- Centralize `tsconfig.json` and Vite config with shared `tsconfig.base.json` and `vite.config.base.ts` ([95c5cbe], [#27])
- Single `vite.config.ts` per package for both build and test (remove separate `vitest.config.ts` files) ([95c5cbe], [#27])
- Fix MCP build target `node20` → `node24` to match engines requirement ([95c5cbe], [#27])
- Add missing coverage thresholds to CLI package ([c22d2da], [#27])
- Remove unused `vitest/globals` from tsconfig types and `globals: true` from vitest config ([95c5cbe], [#27])
- **Architecture**: Restructured from 3 to 4 packages with clean dependency layering ([#25])
  - `productive-api → (nothing)`, `productive-core → api`, `productive-cli → core + api`, `productive-mcp → core + api`
  - MCP no longer depends on CLI
  - Zero reverse/circular imports
- **CLI**: All handlers now delegate to core executors — zero direct `ctx.api` calls ([#25])
  - CLI `api.ts`: 971 → 30 LOC (thin wrapper), `types.ts`: 280 → 30 LOC (re-exports)
  - Formatters re-exported from `@studiometa/productive-api` (deleted 12 duplicate files)
- **CLI**: Resolver functions added to `CommandContext` for better testability ([#23])
  - `ctx.resolveFilters()` and `ctx.tryResolveValue()` methods
- **MCP**: Handlers use `ctx.executor()` instead of direct API calls ([#25])
  - `resolve.ts`: 460 → 62 LOC thin wrapper around core resolver
- **Testing**: `vi.mock()` calls reduced from 197 to 16 across the monorepo ([#25])
  - Remaining mocks are for Node.js builtins (`node:fs`, `node:os`) and singletons only
  - Coverage thresholds enforced: API 90/80, Core 90/90, CLI 84/70, MCP 90/85

### Tests

- 2,142 tests across 4 packages, all passing ([#25], [#32], [#33], [#34])
  - API: 229 tests
  - Core: 295 tests
  - CLI: 1,229 tests
  - MCP: 389 tests
- **CLI/MCP**: Comprehensive test coverage for smart ID resolution ([#23])
- Colocate test files next to source files, removing `__tests__/` directories ([#26])
- Fix `vi.mock()` and dynamic `import()` paths after test file relocation ([#26])
- Silence `console.error` in unknown subcommand tests to clean up test output ([#26])

[Unreleased]: https://github.com/studiometa/productive-tools/compare/0.10.0...HEAD
[0.10.0]: https://github.com/studiometa/productive-tools/compare/0.9.2...0.10.0
[898587e]: https://github.com/studiometa/productive-tools/commit/898587e
[b1abbed]: https://github.com/studiometa/productive-tools/commit/b1abbed
[d6a2d5f]: https://github.com/studiometa/productive-tools/commit/d6a2d5f
[6eb55c2]: https://github.com/studiometa/productive-tools/commit/6eb55c2
[5404334]: https://github.com/studiometa/productive-tools/commit/5404334
[a61244c]: https://github.com/studiometa/productive-tools/commit/a61244c
[453cbe4]: https://github.com/studiometa/productive-tools/commit/453cbe4
[f775d56]: https://github.com/studiometa/productive-tools/commit/f775d56
[d273eae]: https://github.com/studiometa/productive-tools/commit/d273eae
[11d99ef]: https://github.com/studiometa/productive-tools/commit/11d99ef
[832b709]: https://github.com/studiometa/productive-tools/commit/832b709
[e213594]: https://github.com/studiometa/productive-tools/commit/e213594
[6408d3b]: https://github.com/studiometa/productive-tools/commit/6408d3b
[cc3e59e]: https://github.com/studiometa/productive-tools/commit/cc3e59e
[1dff6d8]: https://github.com/studiometa/productive-tools/commit/1dff6d8
[#40]: https://github.com/studiometa/productive-tools/pull/40
[#41]: https://github.com/studiometa/productive-tools/issues/41
[#42]: https://github.com/studiometa/productive-tools/issues/42
[#43]: https://github.com/studiometa/productive-tools/issues/43
[#44]: https://github.com/studiometa/productive-tools/issues/44
[#45]: https://github.com/studiometa/productive-tools/issues/45
[#46]: https://github.com/studiometa/productive-tools/issues/46
[#47]: https://github.com/studiometa/productive-tools/issues/47
[#48]: https://github.com/studiometa/productive-tools/issues/48
[#49]: https://github.com/studiometa/productive-tools/issues/49
[#50]: https://github.com/studiometa/productive-tools/issues/50
[#51]: https://github.com/studiometa/productive-tools/issues/51
[#52]: https://github.com/studiometa/productive-tools/issues/52
[#53]: https://github.com/studiometa/productive-tools/issues/53
[5ecb958]: https://github.com/studiometa/productive-tools/commit/5ecb958
[c908a2a]: https://github.com/studiometa/productive-tools/commit/c908a2a
[#67]: https://github.com/studiometa/productive-tools/issues/67
[#68]: https://github.com/studiometa/productive-tools/issues/68
[#69]: https://github.com/studiometa/productive-tools/pull/69
[#70]: https://github.com/studiometa/productive-tools/pull/70
[81a632b]: https://github.com/studiometa/productive-tools/commit/81a632b
[#71]: https://github.com/studiometa/productive-tools/issues/71
[#72]: https://github.com/studiometa/productive-tools/pull/72
[dda72b6]: https://github.com/studiometa/productive-tools/commit/dda72b6
[60d0dc1]: https://github.com/studiometa/productive-tools/commit/60d0dc1
[d630808]: https://github.com/studiometa/productive-tools/commit/d630808
[3847568]: https://github.com/studiometa/productive-tools/commit/3847568
[090b486]: https://github.com/studiometa/productive-tools/commit/090b486
[#73]: https://github.com/studiometa/productive-tools/issues/73
[#78]: https://github.com/studiometa/productive-tools/pull/78
[0.9.2]: https://github.com/studiometa/productive-tools/compare/0.9.1...0.9.2
[5c982a8]: https://github.com/studiometa/productive-tools/commit/5c982a8
[59afd31]: https://github.com/studiometa/productive-tools/commit/59afd31
[56ce4c8]: https://github.com/studiometa/productive-tools/commit/56ce4c8
[#37]: https://github.com/studiometa/productive-tools/pull/37
[0.9.1]: https://github.com/studiometa/productive-tools/compare/0.9.0...0.9.1
[8ba9e89]: https://github.com/studiometa/productive-tools/commit/8ba9e89
[b68c5f6]: https://github.com/studiometa/productive-tools/commit/b68c5f6
[a620069]: https://github.com/studiometa/productive-tools/commit/a620069
[#36]: https://github.com/studiometa/productive-tools/pull/36
[0.9.0]: https://github.com/studiometa/productive-tools/compare/0.8.5...0.9.0
[95c5cbe]: https://github.com/studiometa/productive-tools/commit/95c5cbe
[c22d2da]: https://github.com/studiometa/productive-tools/commit/c22d2da
[#23]: https://github.com/studiometa/productive-tools/pull/23
[#24]: https://github.com/studiometa/productive-tools/issues/24
[#25]: https://github.com/studiometa/productive-tools/pull/25
[#32]: https://github.com/studiometa/productive-tools/pull/32
[#33]: https://github.com/studiometa/productive-tools/pull/33
[#34]: https://github.com/studiometa/productive-tools/pull/34
[#26]: https://github.com/studiometa/productive-tools/pull/26
[#27]: https://github.com/studiometa/productive-tools/pull/27

## [0.8.5] - 2026-02-10

### Fixed

- **MCP**: Expose `hidden` attribute for comments to distinguish private from public ([fcf6a7b], [#21])

[0.8.5]: https://github.com/studiometa/productive-tools/compare/0.8.4...0.8.5
[fcf6a7b]: https://github.com/studiometa/productive-tools/commit/fcf6a7b
[#21]: https://github.com/studiometa/productive-tools/pull/21

## [0.8.4] - 2026-02-10

### Fixed

- **MCP**: Add version to stderr startup message for debugging ([c5f9898])
- Fix 0.8.3 version link in changelog ([0b181de])

[0.8.4]: https://github.com/studiometa/productive-tools/compare/0.8.3...0.8.4
[c5f9898]: https://github.com/studiometa/productive-tools/commit/c5f9898
[0b181de]: https://github.com/studiometa/productive-tools/commit/0b181de

## [0.8.3] - 2026-02-09

### Added

- **MCP**: Contextual hints system for AI agents - responses include `_hints` field with suggestions for related resources and common actions ([47061f4], [1873439], [#18])
- **MCP**: `no_hints` parameter to disable contextual hints when not needed ([1873439], [#18])

### Changed

- **MCP**: Documentation improved with "Getting Task Context" section and common mistakes to avoid ([be0e07f], [#18])
- **CLI**: Documentation clarified for `api` command - query params vs request body ([be0e07f], [#18])

### Dependencies

- Upgrade vitest `^2.1.8` → `^4.0.18` and @vitest/coverage-v8 `^2.1.9` → `^4.0.18` ([0367efa], [#19])
- Upgrade vite `^6.0.7` → `^7.3.1` ([0367efa], [#19])
- Upgrade @modelcontextprotocol/sdk `^1.0.4` → `^1.26.0` ([0367efa], [#19])

### Fixed

- Fix test mocks for vitest 4 compatibility — arrow functions replaced with function expressions for class constructors ([80cbb77], [#19])
- Fix exit code assertions for 404 errors (`NOT_FOUND_ERROR = 5`) ([80cbb77], [#19])

[0.8.3]: https://github.com/studiometa/productive-tools/compare/0.8.2...0.8.3
[47061f4]: https://github.com/studiometa/productive-tools/commit/47061f4
[1873439]: https://github.com/studiometa/productive-tools/commit/1873439
[be0e07f]: https://github.com/studiometa/productive-tools/commit/be0e07f
[#18]: https://github.com/studiometa/productive-tools/pull/18
[0367efa]: https://github.com/studiometa/productive-tools/commit/0367efa
[80cbb77]: https://github.com/studiometa/productive-tools/commit/80cbb77
[#19]: https://github.com/studiometa/productive-tools/pull/19

## [0.8.2] - 2026-02-03

### Added

- **CLI**: Extended filters for time entries - `status`, `task`, `company`, `deal`, `budget`, `billing-type`, `invoicing-status` ([e5b3d7f], [#17])
- **CLI**: Extended filters for tasks - `workflow-status`, `board`, `company`, `creator`, `parent`, `overdue`, `due-date` ([ea85a0b], [#17])
- **CLI**: Extended filters for projects - `type`, `responsible`, `person`, `status` ([d2910fe], [#17])
- **CLI**: Extended filters for services - `budget-status`, `billing-type`, `time-tracking`, `task`, `person` ([c06cc55], [#17])
- **CLI**: Extended filters for people - `type`, `status`, `project`, `role`, `team` ([fd593e0], [#17])
- **CLI**: Extended filters for deals - `project`, `responsible`, `pipeline`, `budget-status` ([fd593e0], [#17])
- **CLI**: Extended filters for bookings - `project`, `company`, `service`, `event`, `type`, `tentative` ([fd593e0], [#17])
- **CLI**: Extended filters for comments - `page`, `discussion` ([fd593e0], [#17])
- **CLI**: Extended filters for timers - `time-entry` ([fd593e0], [#17])
- **MCP**: Updated skill documentation with all new filter options ([d18d2e9], [#17])

[0.8.2]: https://github.com/studiometa/productive-tools/compare/0.8.1...0.8.2
[e5b3d7f]: https://github.com/studiometa/productive-tools/commit/e5b3d7f
[ea85a0b]: https://github.com/studiometa/productive-tools/commit/ea85a0b
[d2910fe]: https://github.com/studiometa/productive-tools/commit/d2910fe
[c06cc55]: https://github.com/studiometa/productive-tools/commit/c06cc55
[fd593e0]: https://github.com/studiometa/productive-tools/commit/fd593e0
[d18d2e9]: https://github.com/studiometa/productive-tools/commit/d18d2e9
[#17]: https://github.com/studiometa/productive-tools/pull/17

## [0.8.1] - 2026-02-03

### Fixed

- **MCP**: Clarify `query` parameter documentation - behavior varies by resource and may include related fields ([ee87df8])

[0.8.1]: https://github.com/studiometa/productive-tools/compare/0.8.0...0.8.1
[ee87df8]: https://github.com/studiometa/productive-tools/commit/ee87df8

## [0.8.0] - 2026-02-03

### Added

- **CLI**: Shareable skill (`skills/SKILL.md`) for AI agents with commands reference and best practices ([1d8336c], [#14])
- **CLI**: Hints support for all error classes with `toFormattedMessage()` method ([5557df1], [#16])
- **CLI**: `ErrorMessages` factory for consistent, helpful error messages ([3559391], [#16])
- **CLI**: Export all error classes and `ErrorMessages` from main package ([3559391], [#16])
- **CLI**: Tests for timers command ([0f65f07], [#16])
- **MCP**: Shareable skill (`skills/SKILL.md`) for AI agents with tool documentation and examples ([3d40f18], [#14])
- **MCP**: Native `instructions` support for Claude Desktop - skill content sent during initialization ([d20ff5f], [#14])
- **MCP**: MCP annotations for directory compliance (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) ([8a29b74], [#15])
- **MCP**: Zod schemas for input validation with LLM-friendly descriptions ([3c9d6e6], [#15])
- **MCP**: `UserInputError` class with actionable hints for LLM agents ([3c9d6e6], [#15])

### Changed

- **CLI**: Error messages now include hints to guide users on how to resolve issues ([5557df1], [#16])
- **MCP**: Error messages now include hints to guide LLMs on how to resolve issues ([2dfe416], [#15])

[0.8.0]: https://github.com/studiometa/productive-tools/compare/0.7.0...0.8.0
[1d8336c]: https://github.com/studiometa/productive-tools/commit/1d8336c
[3d40f18]: https://github.com/studiometa/productive-tools/commit/3d40f18
[d20ff5f]: https://github.com/studiometa/productive-tools/commit/d20ff5f
[8a29b74]: https://github.com/studiometa/productive-tools/commit/8a29b74
[3c9d6e6]: https://github.com/studiometa/productive-tools/commit/3c9d6e6
[2dfe416]: https://github.com/studiometa/productive-tools/commit/2dfe416
[5557df1]: https://github.com/studiometa/productive-tools/commit/5557df1
[3559391]: https://github.com/studiometa/productive-tools/commit/3559391
[0f65f07]: https://github.com/studiometa/productive-tools/commit/0f65f07
[#14]: https://github.com/studiometa/productive-tools/pull/14
[#15]: https://github.com/studiometa/productive-tools/pull/15
[#16]: https://github.com/studiometa/productive-tools/pull/16

## [0.7.0] - 2026-02-02

### Added

- **MCP**: `include` parameter to fetch related resources in a single request ([34019d6], [#12])
- **MCP**: `help` action for resource-specific documentation with filters, fields, and examples ([5c7c67b], [#12])
- **MCP**: `query` parameter for text search on list actions ([ce971b8], [#12])
- **CLI**: 7 new report types for advanced reporting ([c851dff], [#11])
  - `invoice` - Invoice amounts, status, outstanding balances
  - `payment` - Payment tracking and cash flow
  - `service` - Service-level budget vs worked time
  - `task` - Task completion and workload metrics
  - `company` - Client profitability analysis
  - `deal` - Sales pipeline and deal metrics
  - `timesheet` - Timesheet approval status
- **MCP**: Reports resource with 11 report types ([97c20e0], [#11])

### Changed

- **MCP**: Smart `compact` defaults - `false` for `get` actions, `true` for `list` ([34019d6], [#12])

[0.7.0]: https://github.com/studiometa/productive-tools/compare/0.6.4...0.7.0
[34019d6]: https://github.com/studiometa/productive-tools/commit/34019d6
[5c7c67b]: https://github.com/studiometa/productive-tools/commit/5c7c67b
[ce971b8]: https://github.com/studiometa/productive-tools/commit/ce971b8
[c851dff]: https://github.com/studiometa/productive-tools/commit/c851dff
[97c20e0]: https://github.com/studiometa/productive-tools/commit/97c20e0
[43897fa]: https://github.com/studiometa/productive-tools/commit/43897fa
[#11]: https://github.com/studiometa/productive-tools/pull/11
[#12]: https://github.com/studiometa/productive-tools/pull/12

## [0.6.4] - 2026-02-02

### Fixed

- **MCP**: Add `WWW-Authenticate` header on 401 responses to trigger OAuth re-authentication (RFC 6750) ([65aa7d5])

[0.6.4]: https://github.com/studiometa/productive-tools/compare/0.6.3...0.6.4
[65aa7d5]: https://github.com/studiometa/productive-tools/commit/65aa7d5

## [0.6.3] - 2026-02-02

### Added

- **MCP**: OAuth Protected Resource Metadata endpoint `/.well-known/oauth-protected-resource` (RFC 9728 / MCP spec 2025-03-26) ([aa25804])

[0.6.3]: https://github.com/studiometa/productive-tools/compare/0.6.2...0.6.3
[aa25804]: https://github.com/studiometa/productive-tools/commit/aa25804

## [0.6.2] - 2026-02-02

### Added

- **MCP**: Prepublish script to sync CLI dependency version automatically ([ed4293c])

[0.6.2]: https://github.com/studiometa/productive-tools/compare/0.6.1...0.6.2
[ed4293c]: https://github.com/studiometa/productive-tools/commit/ed4293c

## [0.6.1] - 2026-02-02

### Fixed

- **MCP**: Pin CLI dependency to ^0.6.0 to ensure formatBooking export is available

[0.6.1]: https://github.com/studiometa/productive-tools/compare/0.6.0...0.6.1

## [0.6.0] - 2026-02-02

### Added

- **CLI**: Companies resource with full CRUD support ([86ba32e], [#8])
- **CLI**: Comments resource for tasks, deals, and companies ([bf263a7], [#8])
- **CLI**: Timers resource for real-time tracking ([8e19f00], [#8])
- **CLI**: Deals resource for sales pipeline management ([1496a9d], [#8])
- **CLI**: Bookings resource for scheduling ([381a9df], [#8])
- **CLI**: Reports resource for time/project/budget/person reports ([c6c0cd4], [#8])
- **CLI**: Task create/update commands ([f28defc], [#8])
- **MCP**: Success page after OAuth authorization ([537a598], [#6])
- **CI**: JUnit test reports for Codecov ([8880538], [#10])
- **CI**: Security workflow with npm audit and Semgrep ([e0e5197], [db471fa], [#9])
- **CI**: Renovate configuration for automated dependency updates ([12f79cf], [#9])
- **CI**: CODEOWNERS for security-sensitive files ([d9d8dc5], [#9])
- Pre-commit hooks with husky, lint-staged, and Semgrep ([2462b82], [#9])
- Type-aware linting with oxlint ([d68dc10], [#8])

### Changed

- **MCP**: Refactored handlers into 13 focused modules ([8a10051], [#8])
- oxlint upgraded to v1.43.0 with typescript, import, vitest, promise, node plugins ([d68dc10], [#8])
- oxfmt configured with Studio Meta preferences ([294b323], [#8])
- Consolidated to single root CHANGELOG.md ([ca186cc])

### Fixed

- Dockerfile runs as non-root user ([781dd4b], [#9])
- postbuild.js uses safe format strings ([f20c87d], [#9])
- crypto.ts specifies GCM auth tag length ([e75a3f5], [#9])

[0.6.0]: https://github.com/studiometa/productive-tools/compare/0.5.0...0.6.0
[86ba32e]: https://github.com/studiometa/productive-tools/commit/86ba32e
[bf263a7]: https://github.com/studiometa/productive-tools/commit/bf263a7
[8e19f00]: https://github.com/studiometa/productive-tools/commit/8e19f00
[1496a9d]: https://github.com/studiometa/productive-tools/commit/1496a9d
[381a9df]: https://github.com/studiometa/productive-tools/commit/381a9df
[c6c0cd4]: https://github.com/studiometa/productive-tools/commit/c6c0cd4
[f28defc]: https://github.com/studiometa/productive-tools/commit/f28defc
[537a598]: https://github.com/studiometa/productive-tools/commit/537a598
[8880538]: https://github.com/studiometa/productive-tools/commit/8880538
[e0e5197]: https://github.com/studiometa/productive-tools/commit/e0e5197
[db471fa]: https://github.com/studiometa/productive-tools/commit/db471fa
[12f79cf]: https://github.com/studiometa/productive-tools/commit/12f79cf
[d9d8dc5]: https://github.com/studiometa/productive-tools/commit/d9d8dc5
[2462b82]: https://github.com/studiometa/productive-tools/commit/2462b82
[d68dc10]: https://github.com/studiometa/productive-tools/commit/d68dc10
[8a10051]: https://github.com/studiometa/productive-tools/commit/8a10051
[294b323]: https://github.com/studiometa/productive-tools/commit/294b323
[ca186cc]: https://github.com/studiometa/productive-tools/commit/ca186cc
[781dd4b]: https://github.com/studiometa/productive-tools/commit/781dd4b
[f20c87d]: https://github.com/studiometa/productive-tools/commit/f20c87d
[e75a3f5]: https://github.com/studiometa/productive-tools/commit/e75a3f5
[#6]: https://github.com/studiometa/productive-tools/pull/6
[#8]: https://github.com/studiometa/productive-tools/pull/8
[#9]: https://github.com/studiometa/productive-tools/pull/9
[#10]: https://github.com/studiometa/productive-tools/pull/10

## [0.5.0] - 2026-02-02

### Changed

- **MCP**: Consolidated 13 tools into single `productive` tool with `resource` and `action` parameters ([a622bc1], [#4])
- **MCP**: Token overhead reduced by 86% (~1,300 → ~180 tokens) ([#4])
- **MCP**: Compact output mode enabled by default for list responses ([#4])
- **MCP**: Default page size reduced from 50 to 20 items ([#4])

### Fixed

- **CI**: Simplified GitHub release notes ([f0ef187], [#5])

[0.5.0]: https://github.com/studiometa/productive-tools/compare/0.4.6...0.5.0
[a622bc1]: https://github.com/studiometa/productive-tools/commit/a622bc1
[f0ef187]: https://github.com/studiometa/productive-tools/commit/f0ef187
[#4]: https://github.com/studiometa/productive-tools/pull/4
[#5]: https://github.com/studiometa/productive-tools/pull/5

## [0.4.6] - 2026-02-02

### Fixed

- **MCP**: Tool execution correctly passes credentials to ProductiveApi ([e50803d])

[0.4.6]: https://github.com/studiometa/productive-tools/compare/0.4.5...0.4.6
[e50803d]: https://github.com/studiometa/productive-tools/commit/e50803d

## [0.4.5] - 2026-02-02

### Fixed

- Repository URL now points to productive-tools monorepo ([ce27b36])

[0.4.5]: https://github.com/studiometa/productive-tools/compare/0.4.4...0.4.5
[ce27b36]: https://github.com/studiometa/productive-tools/commit/ce27b36

## [0.4.4] - 2026-02-02

### Changed

- Version is now dynamically injected from package.json at build time ([9f66138])

[0.4.4]: https://github.com/studiometa/productive-tools/compare/0.4.3...0.4.4
[9f66138]: https://github.com/studiometa/productive-tools/commit/9f66138

## [0.4.3] - 2026-02-02

### Fixed

- **CI**: Tag pattern updated to match tags without v prefix ([fff06a8])

[0.4.3]: https://github.com/studiometa/productive-tools/compare/0.4.2...0.4.3
[fff06a8]: https://github.com/studiometa/productive-tools/commit/fff06a8

## [0.4.2] - 2026-02-02

### Added

- **MCP**: Version info in server startup logs ([db8bea3])

### Fixed

- **MCP**: Use centralized version constant ([b51d506])

[0.4.2]: https://github.com/studiometa/productive-tools/compare/0.4.1...0.4.2
[db8bea3]: https://github.com/studiometa/productive-tools/commit/db8bea3
[b51d506]: https://github.com/studiometa/productive-tools/commit/b51d506

## [0.4.1] - 2026-02-02

### Fixed

- **MCP**: Use centralized version constant ([b51d506-2])

[0.4.1]: https://github.com/studiometa/productive-tools/compare/0.4.0...0.4.1
[b51d506-2]: https://github.com/studiometa/productive-tools/commit/b51d506

## [0.4.0] - 2026-02-01

### Added

- **MCP**: OAuth 2.0 support for Claude Desktop ([f46e8bd], [#3])

[0.4.0]: https://github.com/studiometa/productive-tools/compare/v0.3.0...0.4.0
[f46e8bd]: https://github.com/studiometa/productive-tools/commit/f46e8bd
[#3]: https://github.com/studiometa/productive-tools/pull/3

## [0.3.0] - 2026-02-01

### Added

- **CLI**: Renderer infrastructure with pluggable output rendering system ([e5fa4fc], [cc93bf8])
- **CLI**: Budget links - clickable links to budgets in terminal output ([76966a4])

### Changed

- **CLI**: Command architecture split into modular files ([14ad00b], [6df0e37], [0538e59], [fcfd100], [1e8df6e], [1535a27])
- **CLI**: Centralized error handling with Context/DI pattern ([07c5302], [1b399c4])
- **CLI**: Refactored all commands to use new renderer system ([bad60f9], [fdcdd3f], [33ea6cb], [5251a31])

### Fixed

- CI workflow now builds CLI before running MCP tests ([76966a4])

[0.3.0]: https://github.com/studiometa/productive-tools/compare/0.2.4...v0.3.0
[e5fa4fc]: https://github.com/studiometa/productive-tools/commit/e5fa4fc
[cc93bf8]: https://github.com/studiometa/productive-tools/commit/cc93bf8
[76966a4]: https://github.com/studiometa/productive-tools/commit/76966a4
[14ad00b]: https://github.com/studiometa/productive-tools/commit/14ad00b
[6df0e37]: https://github.com/studiometa/productive-tools/commit/6df0e37
[0538e59]: https://github.com/studiometa/productive-tools/commit/0538e59
[fcfd100]: https://github.com/studiometa/productive-tools/commit/fcfd100
[1e8df6e]: https://github.com/studiometa/productive-tools/commit/1e8df6e
[1535a27]: https://github.com/studiometa/productive-tools/commit/1535a27
[07c5302]: https://github.com/studiometa/productive-tools/commit/07c5302
[1b399c4]: https://github.com/studiometa/productive-tools/commit/1b399c4
[bad60f9]: https://github.com/studiometa/productive-tools/commit/bad60f9
[fdcdd3f]: https://github.com/studiometa/productive-tools/commit/fdcdd3f
[33ea6cb]: https://github.com/studiometa/productive-tools/commit/33ea6cb
[5251a31]: https://github.com/studiometa/productive-tools/commit/5251a31

## [0.2.4] - 2026-01-21

### Added

- **Dynamic Argument Completion** - Intelligent autocomplete from local cache ([6a6382c])
  - Config keys completion for `config set/get` commands
  - Project names completion for `--project` flag
  - Service names completion for `--service` flag
  - Person names completion for `--assignee` and `--person` flags
  - Hidden `__completion_helper` command for shell scripts
  - Works in Bash, Zsh, and Fish shells
  - Fast and responsive using SQLite cache
  - Graceful fallback when cache is empty

[0.2.4]: https://github.com/studiometa/productive-tools/compare/0.2.3...0.2.4
[6a6382c]: https://github.com/studiometa/productive-tools/commit/6a6382c

## [0.2.3] - 2026-01-21

### Added

- **Shell Completion** - Automatic installation of tab completion for Bash, Zsh, and Fish ([a634018], [d9a16f7])
  - `completion` command installs to standard directories without editing RC files
  - Installs to `~/.local/share/bash-completion/completions/` (Bash)
  - Installs to `~/.local/share/zsh/site-functions/` (Zsh)
  - Installs to `~/.config/fish/completions/` (Fish)
  - `--print` flag to output script without installing
  - Smart directory detection with fallback to user-local paths
  - Comprehensive help with troubleshooting instructions

### Fixed

- Suppress SQLite experimental warning globally ([1e92112])
  - Warning no longer appears on any CLI command
  - Applied at module load time for complete coverage

[0.2.3]: https://github.com/studiometa/productive-tools/compare/0.2.2...0.2.3
[a634018]: https://github.com/studiometa/productive-tools/commit/a634018
[d9a16f7]: https://github.com/studiometa/productive-tools/commit/d9a16f7
[1e92112]: https://github.com/studiometa/productive-tools/commit/1e92112

## [0.2.2] - 2026-01-21

### Fixed

- Suppress SQLite experimental warning during module import

[0.2.2]: https://github.com/studiometa/productive-tools/compare/0.2.1...0.2.2

## [0.2.1] - 2026-01-21

### Added

- **Secure Keychain Storage** - Cross-platform secure credential storage ([20b8c1e])
  - macOS: Keychain Access (via `security` CLI)
  - Linux: libsecret (via `secret-tool` CLI)
  - Automatic fallback to config file when keychain is unavailable
  - API tokens are automatically stored securely

[0.2.1]: https://github.com/studiometa/productive-tools/compare/0.2.0...0.2.1
[20b8c1e]: https://github.com/studiometa/productive-tools/commit/20b8c1e

## [0.2.0] - 2026-01-21

### Added

- **SQLite Cache** - High-performance unified cache with SQLite backend ([94cc95d], [92a1e4b], [de9f8de], [9616f81])
  - Replaces file-based cache with single SQLite database
  - Stale-while-revalidate pattern for faster responses
  - Background refresh queue for cache updates
  - `cache status` command shows cache statistics
  - `cache clear` command to purge cache
  - `cache queue` command to view pending refresh jobs
- **Custom API Command** - `api` command for direct API requests ([9ec58a9], [28a3dce])
  - Supports GET, POST, PATCH, DELETE methods
  - Field auto-typing with `--field` and `--raw-field`
  - Pagination support with `--paginate`
  - File input with `--input`
- **Kanban View** - `tasks list --format kanban` displays tasks in columns by status ([d7d1d2b])
  - Groups tasks by workflow status name
  - Shows task number, title, and assignee
  - Clickable task links in terminal
- **Enhanced Tasks Output** - Improved task list and get commands ([a696ac2], [7f0e8ec])
  - Shows task number, project, assignee, workflow status
  - Displays worked time vs estimate with over-budget highlighting
  - Clickable links for projects and assignees
- **Terminal Hyperlinks** - Underlined clickable links in supported terminals ([79f2858])
- **CLI Arguments for Credentials** - Pass `--token`, `--org-id`, `--user-id` directly
- Comprehensive AI Agent Integration Guide with CLI argument examples
- Cache architecture documentation ([8c5b8a5])

### Fixed

- Remove unsupported API filters (archived, active, completed) that caused 400 errors
- Projects list now works correctly with Productive.io API
- People list returns all results without filtering issues
- Tasks list works without completion filter errors

### Changed

- Migrated from file-based cache to SQLite for better performance ([de9f8de])
- Updated documentation to match fox-pilot style guide
- Enhanced README with better structure and examples
- Improved error messages and API compatibility

[0.2.0]: https://github.com/studiometa/productive-tools/compare/0.1.0...0.2.0
[94cc95d]: https://github.com/studiometa/productive-tools/commit/94cc95d
[92a1e4b]: https://github.com/studiometa/productive-tools/commit/92a1e4b
[de9f8de]: https://github.com/studiometa/productive-tools/commit/de9f8de
[9616f81]: https://github.com/studiometa/productive-tools/commit/9616f81
[9ec58a9]: https://github.com/studiometa/productive-tools/commit/9ec58a9
[28a3dce]: https://github.com/studiometa/productive-tools/commit/28a3dce
[d7d1d2b]: https://github.com/studiometa/productive-tools/commit/d7d1d2b
[a696ac2]: https://github.com/studiometa/productive-tools/commit/a696ac2
[7f0e8ec]: https://github.com/studiometa/productive-tools/commit/7f0e8ec
[79f2858]: https://github.com/studiometa/productive-tools/commit/79f2858
[8c5b8a5]: https://github.com/studiometa/productive-tools/commit/8c5b8a5

## [0.1.0] - 2026-01-16

### Added

#### Core Features

- **CLI Tool** - Complete command-line interface for Productive.io API
- **Zero Dependencies** - Built entirely with native Node.js APIs (fetch, streams, fs)
- **TypeScript Support** - Full type definitions and type-safe API client
- **Multi-format Output** - JSON, CSV, Table, and Human-readable formats

#### Commands

- **Configuration** - Manage credentials with XDG-compliant storage
  - `config set/get/validate/clear`
- **Projects** - List and retrieve project information
  - `projects list/get` with pagination and sorting
- **Time Entries** - Full CRUD operations on time tracking
  - `time list/get/add/update/delete` with filtering by date, person, project
- **Tasks** - View task information
  - `tasks list/get` with project filtering
- **People** - Browse team members
  - `people list/get`
- **Services** - List available services
  - `services list`
- **Budgets** - View budget information
  - `budgets list` with project filtering

#### AI Agent Optimization

- Structured JSON output for all commands
- Consistent error response format with status codes
- Non-interactive, scriptable commands
- Environment variable configuration
- Deterministic output suitable for parsing
- Exit code conventions (0=success, 1=error)

#### Developer Experience

- **Testing** - 210 tests with 92.38% coverage
  - Vitest test runner
  - Comprehensive unit and integration tests
  - Mock API responses for reliable testing
- **CI/CD** - GitHub Actions workflows
  - Automated testing on push and PR
  - Coverage reporting with Codecov
  - Multi-format coverage reports (text, JSON, HTML, LCOV)
- **Code Quality** - Modern tooling
  - oxlint for fast linting
  - oxfmt for code formatting
  - TypeScript strict mode
  - Pre-publish build validation

#### Documentation

- Comprehensive README with usage examples
- Contributing guide for new developers
- API documentation with TypeScript types
- Environment variable reference
- XDG Base Directory compliance documentation

#### Library Usage

- Exported API client for programmatic use
- Type-safe methods for all API endpoints
- Configuration helpers
- Error handling utilities

### Technical Details

- **Node.js 24+** required (native fetch, type stripping)
- **Vite 6** for fast builds
- **TypeScript 5** with strict type checking
- **Native APIs** only - no runtime dependencies
- **ESM** module format
- **XDG** compliant configuration storage

[0.1.0]: https://github.com/studiometa/productive-tools/releases/tag/0.1.0
