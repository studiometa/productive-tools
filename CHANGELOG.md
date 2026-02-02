# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/studiometa/productive-tools/compare/0.6.4...HEAD
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
