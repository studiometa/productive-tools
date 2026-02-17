# Productive.io Tools

[![CI](https://github.com/studiometa/productive-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/studiometa/productive-tools/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

Monorepo for [Productive.io](https://productive.io) integration tools — CLI and MCP server for AI agents and humans.

## Packages

| Package                                          | Description                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| [`@studiometa/productive-cli`](./packages/cli)   | CLI for Productive.io — projects, time tracking, tasks, reports, and more |
| [`@studiometa/productive-mcp`](./packages/mcp)   | MCP server for Claude Desktop and other MCP clients                       |
| [`@studiometa/productive-core`](./packages/core) | Shared business logic — executor functions with injectable dependencies   |
| [`@studiometa/productive-api`](./packages/api)   | API client, types, and response formatters                                |

## Quick Start

### CLI

```bash
npm install -g @studiometa/productive-cli

productive config set apiToken YOUR_TOKEN
productive config set organizationId YOUR_ORG_ID
productive config set userId YOUR_USER_ID

productive projects list
productive time list --from 2025-01-01
productive reports time --from 2025-01-01
```

### MCP Server (Claude Desktop)

```bash
npm install -g @studiometa/productive-mcp
```

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "productive": {
      "command": "productive-mcp",
      "env": {
        "PRODUCTIVE_ORG_ID": "your-org-id",
        "PRODUCTIVE_API_TOKEN": "your-auth-token",
        "PRODUCTIVE_USER_ID": "your-user-id"
      }
    }
  }
}
```

## Requirements

- **Node.js 24+**
- **Productive.io account** with API access

## Getting Productive.io Credentials

1. Log into [Productive.io](https://productive.io)
2. Go to **Settings → Integrations → API**
3. Generate an API token
4. Note your Organization ID (visible in API settings or URL)
5. Note your User ID (click your profile, visible in URL)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © [Studio Meta](https://www.studiometa.fr)
