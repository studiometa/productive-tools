# Productive.io Tools

[![CI](https://github.com/studiometa/productive-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/studiometa/productive-cli/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/studiometa/productive-cli/branch/main/graph/badge.svg)](https://codecov.io/gh/studiometa/productive-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

Monorepo for Productive.io integration tools - CLI and MCP server for AI agents and humans.

> [!WARNING]
> **AI-Generated Project** — This project was primarily built by AI coding agents (Claude). While functional and tested, it may contain bugs, security issues, or unexpected behavior. Use at your own risk, especially in production environments or with sensitive data.

## Packages

This is a workspace containing two packages:

### [@studiometa/productive-cli](./packages/productive-cli)

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-cli?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-cli)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/productive-cli?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-cli)

CLI tool for interacting with the Productive.io API. Optimized for both AI agents and human users with zero runtime dependencies.

**Features:**
- ✅ AI-optimized with structured JSON output
- 📊 Multiple output formats (JSON, CSV, Table, Human-readable)
- 🔐 Secure credential storage (Keychain, libsecret)
- ⚡ Zero runtime dependencies (native Node.js only)
- 📝 Full TypeScript support
- 🧪 Comprehensive test coverage (92.4%, 210 tests)

**Installation:**
```bash
npm install -g @studiometa/productive-cli
productive --help
```

[Read full documentation →](./packages/productive-cli/README.md)

---

### [@studiometa/productive-mcp](./packages/productive-mcp)

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-mcp?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-mcp)

MCP (Model Context Protocol) server for Productive.io API integration. Enables Claude Desktop and other MCP clients to interact with Productive.io.

**Features:**
- 🤖 Full MCP protocol support
- 🔧 Access to projects, tasks, time entries, people, companies
- 🚀 Zero-config for Claude Desktop
- 📦 Built on official MCP SDK
- 🔗 Powered by @studiometa/productive-cli

**Installation for Claude Desktop:**
```bash
npm install -g @studiometa/productive-mcp
```

Then add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "productive": {
      "command": "productive-mcp",
      "env": {
        "PRODUCTIVE_ORGANIZATION_ID": "your-org-id",
        "PRODUCTIVE_AUTH_TOKEN": "your-auth-token"
      }
    }
  }
}
```

[Read full documentation →](./packages/productive-mcp/README.md)

---

## Quick Start

### For CLI Users

```bash
# Install CLI
npm install -g @studiometa/productive-cli

# Configure
productive config set apiToken YOUR_TOKEN
productive config set organizationId YOUR_ORG_ID

# Use
productive projects list
productive time list --from 2024-01-01
```

### For Claude Desktop Users

```bash
# Install MCP server
npm install -g @studiometa/productive-mcp

# Configure in Claude Desktop config
# See packages/productive-mcp/README.md for details

# Use in Claude Desktop
# Just ask Claude to interact with Productive.io!
```

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/studiometa/productive-cli
cd productive-cli

# Install dependencies
npm install

# Build all packages
npm run build
```

### Workspace Commands

```bash
# Build all packages
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Clean build artifacts
npm run clean
```

### Working on Individual Packages

```bash
# Build specific package
npm run build -w @studiometa/productive-cli
npm run build -w @studiometa/productive-mcp

# Test specific package
npm run test -w @studiometa/productive-cli

# Watch mode for development
npm run dev -w @studiometa/productive-cli
npm run dev -w @studiometa/productive-mcp
```

## Architecture

```
productive-cli/
├── packages/
│   ├── productive-cli/      # CLI tool (core API client)
│   │   ├── src/
│   │   │   ├── api.ts       # ProductiveAPI class
│   │   │   ├── cli.ts       # CLI entry point
│   │   │   ├── config.ts    # Configuration management
│   │   │   └── commands/    # CLI commands
│   │   └── package.json
│   │
│   └── productive-mcp/      # MCP server
│       ├── src/
│       │   └── index.ts     # MCP server implementation
│       └── package.json
│
├── package.json             # Root workspace config
└── README.md               # This file
```

## Requirements

- **Node.js 24+** (uses native fetch and modern APIs)
- **Productive.io account** with API access

## Getting Productive.io Credentials

1. Log into [Productive.io](https://productive.io)
2. Go to Settings → Integrations → API
3. Generate an API token
4. Note your Organization ID (visible in API settings or URL)

## Publishing

```bash
# Publish CLI package
npm run release:cli

# Publish MCP package
npm run release:mcp
```

## License

MIT © [Studio Meta](https://www.studiometa.fr)

## Links

- [CLI Package](./packages/productive-cli)
- [MCP Package](./packages/productive-mcp)
- [GitHub Issues](https://github.com/studiometa/productive-cli/issues)
- [Productive.io API Docs](https://developer.productive.io)
- [MCP Documentation](https://modelcontextprotocol.io)

## Support

For issues, questions, or contributions:
- Open an issue on [GitHub](https://github.com/studiometa/productive-cli/issues)
- Check the [Productive.io API documentation](https://developer.productive.io)
- For MCP-specific questions, see [MCP docs](https://modelcontextprotocol.io)
