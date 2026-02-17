# @studiometa/productive-mcp

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-mcp?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for [Productive.io](https://productive.io). Enables Claude Desktop and other MCP clients to interact with Productive.io for project management, time tracking, task management, and reporting.

## Features

- Single unified `productive` tool — minimal token overhead (~170 tokens)
- Smart ID resolution — use emails and project numbers instead of numeric IDs
- Two modes: **local (stdio)** for personal use, **remote (HTTP)** for teams
- OAuth 2.0 support for Claude Desktop custom connectors
- Built-in `help` action for self-documentation

## Mode 1: Local (stdio)

Run the MCP server locally on your machine.

```bash
npm install -g @studiometa/productive-mcp
```

Add to your Claude Desktop config:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

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

Alternatively, omit the `env` block and ask Claude to configure credentials interactively.

## Mode 2: Remote (HTTP)

Deploy once, share with your team via Claude Desktop's custom connector feature.

### Deploy

```bash
# Docker
docker build -t productive-mcp-server -f packages/mcp/Dockerfile .
docker run -d -p 3000:3000 -e OAUTH_SECRET="$(openssl rand -base64 32)" productive-mcp-server

# Or Node.js
npm install -g @studiometa/productive-mcp
PORT=3000 OAUTH_SECRET="your-secret" productive-mcp-server
```

> **Important**: Always set `OAUTH_SECRET` in production for secure OAuth token encryption.

### Configure Claude Desktop

1. Open Claude Desktop **Settings → Custom Connectors**
2. Add a custom connector:
   - **Remote MCP server URL**: `https://your-server.example.com/mcp`
   - **Authorization URL**: `https://your-server.example.com/authorize`
   - **Token URL**: `https://your-server.example.com/token`
3. Users log in with their own Productive credentials via the OAuth form

The OAuth implementation is **stateless** — credentials are encrypted directly into the token, no database required.

### Server Endpoints

| Endpoint                                  | Method   | Description                      |
| ----------------------------------------- | -------- | -------------------------------- |
| `/mcp`                                    | POST     | MCP JSON-RPC endpoint            |
| `/health`                                 | GET      | Health check                     |
| `/authorize`                              | GET/POST | OAuth authorization (login form) |
| `/token`                                  | POST     | OAuth token exchange             |
| `/.well-known/oauth-authorization-server` | GET      | OAuth metadata                   |

### Environment Variables

| Variable       | Required         | Description                        |
| -------------- | ---------------- | ---------------------------------- |
| `PORT`         | No               | Server port (default: 3000)        |
| `HOST`         | No               | Bind address (default: 0.0.0.0)    |
| `OAUTH_SECRET` | Yes (production) | Secret for encrypting OAuth tokens |

## The `productive` Tool

A single unified tool for all Productive.io operations:

```
productive(resource, action, ...)
```

### Resources & Actions

| Resource    | Actions                                     |
| ----------- | ------------------------------------------- |
| `projects`  | `list`, `get`                               |
| `time`      | `list`, `get`, `create`, `update`, `delete` |
| `tasks`     | `list`, `get`, `create`, `update`           |
| `services`  | `list`                                      |
| `people`    | `list`, `get`, `me`                         |
| `companies` | `list`, `get`, `create`, `update`           |
| `comments`  | `list`, `get`, `create`, `update`           |
| `timers`    | `list`, `get`, `start`, `stop`              |
| `deals`     | `list`, `get`, `create`, `update`           |
| `bookings`  | `list`, `get`, `create`, `update`           |
| `reports`   | `get` (11 report types)                     |

Use `action="help"` with any resource for detailed documentation on available parameters and filters.

### Common Parameters

| Parameter           | Type     | Description                                                   |
| ------------------- | -------- | ------------------------------------------------------------- |
| `resource`          | string   | **Required** — resource name (see table above)                |
| `action`            | string   | **Required** — action to perform                              |
| `id`                | string   | Resource ID (for `get`, `update`, `delete`)                   |
| `filter`            | object   | Filter criteria for `list` actions                            |
| `page` / `per_page` | number   | Pagination (default: 20 items per page, max: 200)             |
| `compact`           | boolean  | Compact output (default: true for list, false for get)        |
| `include`           | string[] | Related resources to include (e.g. `["project", "assignee"]`) |
| `query`             | string   | Text search for `list` actions                                |

### Configuration Tools (Local mode only)

| Tool                    | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `productive_configure`  | Set credentials (organizationId, apiToken, userId) |
| `productive_get_config` | View current configuration (token masked)          |

## Usage Examples

```
"Show me all projects"
→ productive(resource="projects", action="list")

"Log 2 hours today on service 456"
→ productive(resource="time", action="create", service_id="456", time=120, date="2025-01-15")

"What did I work on last week?"
→ productive(resource="time", action="list", filter={person_id: "me", after: "2025-01-08", before: "2025-01-14"})

"Show tasks for project 789"
→ productive(resource="tasks", action="list", filter={project_id: "789"})
```

## Requirements

- Node.js 24+
- Productive.io account with API access
- Docker (optional, for remote deployment)

## License

MIT © [Studio Meta](https://www.studiometa.fr)
