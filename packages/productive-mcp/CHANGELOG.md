# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.3] - 2026-02-02

### Fixed
- CI publish workflow now triggers on tags without `v` prefix (fff06a8)

## [0.4.2] - 2026-02-02

### Added
- Server startup logs now display package version and Node.js version for easier debugging (db8bea3)

## [0.4.1] - 2026-02-02

### Fixed
- Version now correctly displayed in HTTP server endpoints (was showing 0.1.0) (b51d506)
- Tests use dynamic VERSION constant to avoid failures on version bumps

## [0.4.0] - 2026-02-02

### Added
- **OAuth 2.0 Support** - MCP auth spec compliant authentication for Claude Desktop (f46e8bd, #3)
  - OAuth 2.1 with PKCE (S256) validation
  - Dynamic Client Registration endpoint (`/register`) per RFC 7591
  - OAuth metadata discovery (`/.well-known/oauth-authorization-server`) per RFC 8414
  - Token refresh support with rotation
  - Stateless implementation using AES-256-GCM encryption
- **Login Form UI** - User-friendly credential entry for Productive.io
- **Security Improvements**
  - Redirect URI validation (HTTPS or localhost only)
  - Token expiration (1h access, 30d refresh)
  - PKCE required for all authorization requests

### Changed
- Updated README with OAuth configuration documentation

## [0.3.0] - 2026-02-01

### Added
- **HTTP Server Transport** - Remote deployment mode for team sharing (d6d7511)
  - New `productive-mcp-server` binary for HTTP transport
  - Bearer token authentication for secure remote access
  - Deploy once, share with entire team via Claude Desktop custom connectors
- **Docker Support** - Container-ready deployment (eba336e)
  - Production `Dockerfile` with minimal image
  - Development `Dockerfile.dev` with hot reload
  - `docker-compose.yml` for easy orchestration
- **Shared Modules** - Extracted reusable components (2cad5f7)
  - `auth.ts` - Authentication utilities
  - `handlers.ts` - Request handlers
  - `tools.ts` - MCP tool definitions
- **Agent-Friendly Formatters** - Structured response formatting (d5020cb)
- **Comprehensive Test Suite** - 93 tests with 96% coverage (27a3e6f, 2229c28)
  - Auth module tests
  - HTTP transport tests
  - Tools and handlers tests
  - Formatter tests

### Changed
- Refactored stdio transport to use shared modules (f88fe8b)
- Updated build config for multi-entry output (bc5c066)
- Rewrote README for dual transport modes documentation (0482245)
- Refactored for testability with dependency injection (2229c28)

## [0.1.0] - 2026-01-28

### Added
- Initial release of Productive MCP server
- Full MCP protocol support via @modelcontextprotocol/sdk
- Integration with @studiometa/productive-cli
- Support for projects (list, get)
- Support for tasks (list, get)
- Support for time entries (list, get, create)
- Support for people (list, get)
- Claude Desktop configuration support
- Comprehensive deployment documentation
- Server deployment options (PM2, systemd, Docker)

[Unreleased]: https://github.com/studiometa/productive-tools/compare/0.4.3...HEAD
[0.4.3]: https://github.com/studiometa/productive-tools/compare/0.4.2...0.4.3
[0.4.2]: https://github.com/studiometa/productive-tools/compare/0.4.1...0.4.2
[0.4.1]: https://github.com/studiometa/productive-tools/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/studiometa/productive-tools/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/studiometa/productive-tools/compare/0.1.0...0.3.0
[0.1.0]: https://github.com/studiometa/productive-tools/releases/tag/0.1.0
