# @studiometa/productive-mcp

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-mcp?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-mcp)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/productive-mcp?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for [Productive.io](https://productive.io). Enables Claude Desktop and other MCP clients to interact with Productive.io for project management, time tracking, task management, and reporting.

## Features

- Single unified `productive` tool — minimal token overhead (~170 tokens)
- Smart ID resolution — use emails and project numbers instead of numeric IDs
- Rich context — `action=context` fetches a resource with all related data in one call
- Proactive suggestions — data-aware warnings (overdue tasks, long-running timers, etc.)
- Compound workflows — multi-step operations (complete task, log day, weekly standup)
- Input validation — helpful redirects for wrong actions/resources, include validation
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

| Endpoint                                | Method   | Description                   |
| --------------------------------------- | -------- | ----------------------------- |
| `/mcp`                                  | GET/POST/DELETE | MCP Streamable HTTP endpoint |
| `/health`                               | GET      | Health check                  |
| `/authorize`                            | GET/POST | OAuth authorization form      |
| `/token`                                | POST     | OAuth token exchange          |
| `/.well-known/oauth-authorization-server` | GET    | OAuth metadata                |
| `/.well-known/oauth-protected-resource/mcp` | GET   | Protected resource metadata   |

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

| Resource      | Actions                                                                  | Description                                              |
| ------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `projects`    | `list`, `get`, `resolve`, `context`, `help`                              | Project management                                       |
| `time`        | `list`, `get`, `create`, `update`, `resolve`, `help`                     | Time tracking                                            |
| `tasks`       | `list`, `get`, `create`, `update`, `resolve`, `context`, `help`          | Task management                                          |
| `services`    | `list`, `get`, `resolve`, `help`                                         | Budget line items                                        |
| `people`      | `list`, `get`, `me`, `resolve`, `help`                                   | Team members                                             |
| `companies`   | `list`, `get`, `create`, `update`, `resolve`, `help`                     | Client companies                                         |
| `comments`    | `list`, `get`, `create`, `update`, `help`                                | Comments on tasks/deals                                  |
| `attachments` | `list`, `get`, `delete`, `help`                                          | File attachments                                         |
| `timers`      | `list`, `get`, `start`, `stop`, `help`                                   | Active timers                                            |
| `deals`       | `list`, `get`, `create`, `update`, `resolve`, `context`, `help`          | Sales deals & budgets (`filter[type]=2` for budgets)     |
| `bookings`    | `list`, `get`, `create`, `update`, `help`                                | Resource scheduling                                      |
| `pages`       | `list`, `get`, `create`, `update`, `delete`, `help`                      | Wiki/docs pages                                          |
| `discussions` | `list`, `get`, `create`, `update`, `delete`, `resolve`, `reopen`, `help` | Discussions on pages                                     |
| `activities`  | `list`, `help`                                                           | Activity feed (audit log of create/update/delete events) |
| `reports`     | `get`, `help`                                                            | Generate reports (11 report types)                       |
| `workflows`   | `complete_task`, `log_day`, `weekly_standup`, `help`                     | Compound workflows chaining multiple operations          |
| `summaries`   | `my_day`, `project_health`, `team_pulse`                                 | Dashboard summaries with proactive suggestions           |
| `batch`       | `run`                                                                    | Execute up to 10 operations in parallel                  |
| `search`      | `run`                                                                    | Cross-resource text search                               |

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
