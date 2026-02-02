# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-02-02

### Changed

- No changes for this release

## [0.4.5] - 2026-02-02

### Fixed

- Repository URL now points to productive-tools monorepo (ce27b36)

## [0.4.4] - 2026-02-02

### Changed

- Version is now dynamically injected from package.json at build time (9f66138)

### Added

- **Monorepo Structure** - Restructured as npm workspace with separate packages (f74945b)
- **Centralized Error Handling** - New error handling and context pattern for commands (07c5302, 1b399c4)
  - `AppError` base class with typed error codes
  - `ConfigurationError`, `ApiError`, `ValidationError` specialized types
  - `createContext()` for dependency injection in commands
  - `handleCommandError()` for consistent error formatting
- **Shared Formatters** - Reusable formatters for CLI and MCP integration (fa37749)
  - `formatTimeEntry()`, `formatProject()`, `formatTask()`, `formatPerson()`
  - `formatService()`, `formatBudget()`, `formatListResponse()`
  - Type-safe formatter options with `FormatterOptions`
- **Result Type Utilities** - Functional error handling with `Result<T, E>` pattern (07c5302)

### Changed

- Migrated all commands to use centralized error handling and context pattern (1b399c4)
- Refactored command structure for better testability and reuse

### Fixed

- Fix config-store test on macOS (was using wrong config directory path) (87af7cf)
- Fix TypeScript build errors in context.ts and errors.ts (e0df59d)
- Fix linting errors and remove unused code (ec8a0ed)

## [0.2.4] - 2026-01-21

### Added

- **Dynamic Argument Completion** - Intelligent autocomplete from local cache (6a6382c)
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

- **Shell Completion** - Automatic installation of tab completion for Bash, Zsh, and Fish (a634018, d9a16f7)
  - `completion` command installs to standard directories without editing RC files
  - Installs to `~/.local/share/bash-completion/completions/` (Bash)
  - Installs to `~/.local/share/zsh/site-functions/` (Zsh)
  - Installs to `~/.config/fish/completions/` (Fish)
  - `--print` flag to output script without installing
  - Smart directory detection with fallback to user-local paths
  - Comprehensive help with troubleshooting instructions

### Fixed

- Suppress SQLite experimental warning globally (1e92112)
  - Warning no longer appears on any CLI command
  - Applied at module load time for complete coverage

## [0.2.2] - 2026-01-21

### Fixed

- Suppress SQLite experimental warning during module import

## [0.2.1] - 2026-01-21

### Added

- **Secure Keychain Storage** - Cross-platform secure credential storage (20b8c1e)
  - macOS: Keychain Access (via `security` CLI)
  - Linux: libsecret (via `secret-tool` CLI)
  - Automatic fallback to config file when keychain is unavailable
  - API tokens are automatically stored securely

## [0.2.0] - 2026-01-21

### Added

- **SQLite Cache** - High-performance unified cache with SQLite backend (94cc95d, 92a1e4b, de9f8de, 9616f81)
  - Replaces file-based cache with single SQLite database
  - Stale-while-revalidate pattern for faster responses
  - Background refresh queue for cache updates
  - `cache status` command shows cache statistics
  - `cache clear` command to purge cache
  - `cache queue` command to view pending refresh jobs
- **Custom API Command** - `api` command for direct API requests (9ec58a9, 28a3dce)
  - Supports GET, POST, PATCH, DELETE methods
  - Field auto-typing with `--field` and `--raw-field`
  - Pagination support with `--paginate`
  - File input with `--input`
- **Kanban View** - `tasks list --format kanban` displays tasks in columns by status (d7d1d2b)
  - Groups tasks by workflow status name
  - Shows task number, title, and assignee
  - Clickable task links in terminal
- **Enhanced Tasks Output** - Improved task list and get commands (a696ac2, 7f0e8ec)
  - Shows task number, project, assignee, workflow status
  - Displays worked time vs estimate with over-budget highlighting
  - Clickable links for projects and assignees
- **Terminal Hyperlinks** - Underlined clickable links in supported terminals (79f2858)
- **CLI Arguments for Credentials** - Pass `--token`, `--org-id`, `--user-id` directly
- Comprehensive AI Agent Integration Guide with CLI argument examples
- Cache architecture documentation (8c5b8a5)

### Fixed

- Remove unsupported API filters (archived, active, completed) that caused 400 errors
- Projects list now works correctly with Productive.io API
- People list returns all results without filtering issues
- Tasks list works without completion filter errors

### Changed

- Migrated from file-based cache to SQLite for better performance (de9f8de)
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

[Unreleased]: https://github.com/studiometa/productive-tools/compare/0.5.0...HEAD
[0.5.0]: https://github.com/studiometa/productive-tools/compare/0.4.5...0.5.0
[0.4.5]: https://github.com/studiometa/productive-tools/compare/0.4.4...0.4.5
[0.4.4]: https://github.com/studiometa/productive-tools/compare/0.4.3...0.4.4
[0.2.1]: https://github.com/studiometa/productive-cli/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/studiometa/productive-cli/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/studiometa/productive-cli/releases/tag/0.1.0
