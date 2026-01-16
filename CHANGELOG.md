# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **CLI Arguments for Credentials** - Pass `--token`, `--org-id`, `--user-id` directly
  - Supports alternative flags: `--api-token`, `--organization-id`
  - Highest priority over environment variables and config file
  - Perfect for one-off commands and CI/CD pipelines
- Comprehensive AI Agent Integration Guide with CLI argument examples
- Improved README with detailed examples and credential priority documentation
- Badge improvements for better project visibility

### Fixed
- Remove unsupported API filters (archived, active, completed) that caused 400 errors
- Projects list now works correctly with Productive.io API
- People list returns all results without filtering issues
- Tasks list works without completion filter errors

### Changed
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

[Unreleased]: https://github.com/studiometa/productive-cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/studiometa/productive-cli/releases/tag/v0.1.0
