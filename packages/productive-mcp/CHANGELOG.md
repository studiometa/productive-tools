# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **Unit Tests** - Auth module test coverage (487e3df)

### Changed
- Refactored stdio transport to use shared modules (f88fe8b)
- Updated build config for multi-entry output (bc5c066)
- Rewrote README for dual transport modes documentation (0482245)

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

[Unreleased]: https://github.com/studiometa/productive-cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/studiometa/productive-cli/releases/tag/v0.1.0
