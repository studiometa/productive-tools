# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
- **CLI**: Resolver functions added to `CommandContext` for better testability ([#23])
  - `ctx.resolveFilters()` and `ctx.tryResolveValue()` methods
  - Enables mocking resolution in tests without module-level mocks
  - See [#24] for planned Nx-style architecture refactor

[#23]: https://github.com/studiometa/productive-tools/pull/23
[#24]: https://github.com/studiometa/productive-tools/issues/24

## [0.8.5] - 2026-02-10

### Fixed

- **MCP**: Expose `hidden` attribute for comments to distinguish private from public ([fcf6a7b], [#21])

[fcf6a7b]: https://github.com/studiometa/productive-tools/commit/fcf6a7b
[#21]: https://github.com/studiometa/productive-tools/pull/21

## [0.8.4] - 2026-02-10

### Fixed

- **MCP**: Add version to stderr startup message for debugging ([c5f9898])
- Fix 0.8.3 version link in changelog ([0b181de])

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

## [0.6.3] - 2026-02-02

### Added

- **MCP**: OAuth Protected Resource Metadata endpoint `/.well-known/oauth-protected-resource` (RFC 9728 / MCP spec 2025-03-26) ([aa25804])

## [0.6.2] - 2026-02-02

### Added

- **MCP**: Prepublish script to sync CLI dependency version automatically ([ed4293c])

## [0.6.1] - 2026-02-02

### Fixed

- **MCP**: Pin CLI dependency to ^0.6.0 to ensure formatBooking export is available

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

## [0.5.0] - 2026-02-02

### Changed

- **MCP**: Consolidated 13 tools into single `productive` tool with `resource` and `action` parameters ([a622bc1], [#4])
- **MCP**: Token overhead reduced by 86% (~1,300 → ~180 tokens) ([#4])
- **MCP**: Compact output mode enabled by default for list responses ([#4])
- **MCP**: Default page size reduced from 50 to 20 items ([#4])

### Fixed

- **CI**: Simplified GitHub release notes ([f0ef187], [#5])

## [0.4.6] - 2026-02-02

### Fixed

- **MCP**: Tool execution correctly passes credentials to ProductiveApi ([e50803d])

## [0.4.5] - 2026-02-02

### Fixed

- Repository URL now points to productive-tools monorepo ([ce27b36])

## [0.4.4] - 2026-02-02

### Changed

- Version is now dynamically injected from package.json at build time ([9f66138])

## [0.4.3] - 2026-02-02

### Fixed

- **CI**: Tag pattern updated to match tags without v prefix ([fff06a8])

## [0.4.2] - 2026-02-02

### Added

- **MCP**: Version info in server startup logs ([db8bea3])

### Fixed

- **MCP**: Use centralized version constant ([b51d506])

## [0.4.1] - 2026-02-02

### Fixed

- **MCP**: Use centralized version constant ([b51d506])

## [0.4.0] - 2026-02-01

### Added

- **MCP**: OAuth 2.0 support for Claude Desktop ([f46e8bd], [#3])

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

## [0.2.2] - 2026-01-21

### Fixed

- Suppress SQLite experimental warning during module import

## [0.2.1] - 2026-01-21

### Added

- **Secure Keychain Storage** - Cross-platform secure credential storage ([20b8c1e])
  - macOS: Keychain Access (via `security` CLI)
  - Linux: libsecret (via `secret-tool` CLI)
  - Automatic fallback to config file when keychain is unavailable
  - API tokens are automatically stored securely

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

[Unreleased]: https://github.com/studiometa/productive-tools/compare/0.8.5...HEAD
[#23]: https://github.com/studiometa/productive-tools/pull/23
[0.8.4]: https://github.com/studiometa/productive-tools/compare/0.8.3...0.8.4
[0.8.3]: https://github.com/studiometa/productive-tools/compare/0.8.2...0.8.3
[0.8.2]: https://github.com/studiometa/productive-tools/compare/0.8.1...0.8.2
[0.8.1]: https://github.com/studiometa/productive-tools/compare/0.8.0...0.8.1
[0.8.0]: https://github.com/studiometa/productive-tools/compare/0.7.0...0.8.0
[0.7.0]: https://github.com/studiometa/productive-tools/compare/0.6.4...0.7.0
[0.6.4]: https://github.com/studiometa/productive-tools/compare/0.6.3...0.6.4
[0.6.3]: https://github.com/studiometa/productive-tools/compare/0.6.2...0.6.3
[0.6.2]: https://github.com/studiometa/productive-tools/compare/0.6.1...0.6.2
[0.6.1]: https://github.com/studiometa/productive-tools/compare/0.6.0...0.6.1
[0.6.0]: https://github.com/studiometa/productive-tools/compare/0.5.0...0.6.0
[0.5.0]: https://github.com/studiometa/productive-tools/compare/0.4.6...0.5.0
[0.4.6]: https://github.com/studiometa/productive-tools/compare/0.4.5...0.4.6
[0.4.5]: https://github.com/studiometa/productive-tools/compare/0.4.4...0.4.5
[0.4.4]: https://github.com/studiometa/productive-tools/compare/0.4.3...0.4.4
[0.4.3]: https://github.com/studiometa/productive-tools/compare/0.4.2...0.4.3
[0.4.2]: https://github.com/studiometa/productive-tools/compare/0.4.1...0.4.2
[0.4.1]: https://github.com/studiometa/productive-tools/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/studiometa/productive-tools/compare/v0.3.0...0.4.0
[0.3.0]: https://github.com/studiometa/productive-tools/compare/0.2.4...v0.3.0
[0.2.4]: https://github.com/studiometa/productive-tools/compare/0.2.3...0.2.4
[0.2.3]: https://github.com/studiometa/productive-tools/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/studiometa/productive-tools/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/studiometa/productive-tools/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/studiometa/productive-tools/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/studiometa/productive-tools/releases/tag/0.1.0
[#3]: https://github.com/studiometa/productive-tools/pull/3
[#4]: https://github.com/studiometa/productive-tools/pull/4
[#5]: https://github.com/studiometa/productive-tools/pull/5
[#6]: https://github.com/studiometa/productive-tools/pull/6
[#8]: https://github.com/studiometa/productive-tools/pull/8
[#9]: https://github.com/studiometa/productive-tools/pull/9
[#10]: https://github.com/studiometa/productive-tools/pull/10
[0538e59]: https://github.com/studiometa/productive-tools/commit/0538e59
[07c5302]: https://github.com/studiometa/productive-tools/commit/07c5302
[12f79cf]: https://github.com/studiometa/productive-tools/commit/12f79cf
[1496a9d]: https://github.com/studiometa/productive-tools/commit/1496a9d
[14ad00b]: https://github.com/studiometa/productive-tools/commit/14ad00b
[1535a27]: https://github.com/studiometa/productive-tools/commit/1535a27
[1b399c4]: https://github.com/studiometa/productive-tools/commit/1b399c4
[1e8df6e]: https://github.com/studiometa/productive-tools/commit/1e8df6e
[1e92112]: https://github.com/studiometa/productive-tools/commit/1e92112
[20b8c1e]: https://github.com/studiometa/productive-tools/commit/20b8c1e
[2462b82]: https://github.com/studiometa/productive-tools/commit/2462b82
[28a3dce]: https://github.com/studiometa/productive-tools/commit/28a3dce
[294b323]: https://github.com/studiometa/productive-tools/commit/294b323
[33ea6cb]: https://github.com/studiometa/productive-tools/commit/33ea6cb
[381a9df]: https://github.com/studiometa/productive-tools/commit/381a9df
[3f4cb09]: https://github.com/studiometa/productive-tools/commit/3f4cb09
[5251a31]: https://github.com/studiometa/productive-tools/commit/5251a31
[6a6382c]: https://github.com/studiometa/productive-tools/commit/6a6382c
[6df0e37]: https://github.com/studiometa/productive-tools/commit/6df0e37
[76966a4]: https://github.com/studiometa/productive-tools/commit/76966a4
[781dd4b]: https://github.com/studiometa/productive-tools/commit/781dd4b
[79f2858]: https://github.com/studiometa/productive-tools/commit/79f2858
[7f0e8ec]: https://github.com/studiometa/productive-tools/commit/7f0e8ec
[86ba32e]: https://github.com/studiometa/productive-tools/commit/86ba32e
[8880538]: https://github.com/studiometa/productive-tools/commit/8880538
[8a10051]: https://github.com/studiometa/productive-tools/commit/8a10051
[8c5b8a5]: https://github.com/studiometa/productive-tools/commit/8c5b8a5
[8e19f00]: https://github.com/studiometa/productive-tools/commit/8e19f00
[92a1e4b]: https://github.com/studiometa/productive-tools/commit/92a1e4b
[94cc95d]: https://github.com/studiometa/productive-tools/commit/94cc95d
[9616f81]: https://github.com/studiometa/productive-tools/commit/9616f81
[9ec58a9]: https://github.com/studiometa/productive-tools/commit/9ec58a9
[a634018]: https://github.com/studiometa/productive-tools/commit/a634018
[a696ac2]: https://github.com/studiometa/productive-tools/commit/a696ac2
[bad60f9]: https://github.com/studiometa/productive-tools/commit/bad60f9
[bf263a7]: https://github.com/studiometa/productive-tools/commit/bf263a7
[c6c0cd4]: https://github.com/studiometa/productive-tools/commit/c6c0cd4
[cc93bf8]: https://github.com/studiometa/productive-tools/commit/cc93bf8
[d68dc10]: https://github.com/studiometa/productive-tools/commit/d68dc10
[d7d1d2b]: https://github.com/studiometa/productive-tools/commit/d7d1d2b
[d9a16f7]: https://github.com/studiometa/productive-tools/commit/d9a16f7
[d9d8dc5]: https://github.com/studiometa/productive-tools/commit/d9d8dc5
[db471fa]: https://github.com/studiometa/productive-tools/commit/db471fa
[de9f8de]: https://github.com/studiometa/productive-tools/commit/de9f8de
[e0e5197]: https://github.com/studiometa/productive-tools/commit/e0e5197
[e5fa4fc]: https://github.com/studiometa/productive-tools/commit/e5fa4fc
[e75a3f5]: https://github.com/studiometa/productive-tools/commit/e75a3f5
[f20c87d]: https://github.com/studiometa/productive-tools/commit/f20c87d
[f28defc]: https://github.com/studiometa/productive-tools/commit/f28defc
[fcfd100]: https://github.com/studiometa/productive-tools/commit/fcfd100
[fdcdd3f]: https://github.com/studiometa/productive-tools/commit/fdcdd3f
[537a598]: https://github.com/studiometa/productive-tools/commit/537a598
[a622bc1]: https://github.com/studiometa/productive-tools/commit/a622bc1
[f0ef187]: https://github.com/studiometa/productive-tools/commit/f0ef187
[e50803d]: https://github.com/studiometa/productive-tools/commit/e50803d
[ce27b36]: https://github.com/studiometa/productive-tools/commit/ce27b36
[9f66138]: https://github.com/studiometa/productive-tools/commit/9f66138
[fff06a8]: https://github.com/studiometa/productive-tools/commit/fff06a8
[db8bea3]: https://github.com/studiometa/productive-tools/commit/db8bea3
[b51d506]: https://github.com/studiometa/productive-tools/commit/b51d506
[f46e8bd]: https://github.com/studiometa/productive-tools/commit/f46e8bd
[65aa7d5]: https://github.com/studiometa/productive-tools/commit/65aa7d5
[aa25804]: https://github.com/studiometa/productive-tools/commit/aa25804
[ca186cc]: https://github.com/studiometa/productive-tools/commit/ca186cc
[ed4293c]: https://github.com/studiometa/productive-tools/commit/ed4293c
