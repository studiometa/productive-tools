# @studiometa/productive-mcp

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-mcp?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-mcp)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/productive-mcp?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for [Productive.io](https://productive.io). Enables Claude Desktop and other MCP clients to interact with Productive.io for project management, time tracking, task management, and reporting.

## Features

- Single unified `productive` tool — minimal token overhead (~170 tokens)
- Read-only `productive_read` sibling tool (`readOnlyHint: true`) for clients that only allow read-only tools
- Smart ID resolution — use emails and project numbers instead of numeric IDs
- Rich context — `action=context` fetches a resource with all related data in one call
- Proactive suggestions — data-aware warnings (overdue tasks, long-running timers, etc.)
- Compound workflows — multi-step operations (complete task, log day, weekly standup)
- Input validation — helpful redirects for wrong actions/resources, include validation
- Two modes: **local (stdio)** for personal use, **remote (HTTP)** for teams
- OAuth 2.0 support for Claude Desktop custom connectors
- Built-in `help` action for self-documentation
- Raw API escape hatches: `api_read` for documented GET endpoints and gated `api_write` for documented writes

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

| Endpoint                                    | Method          | Description                  |
| ------------------------------------------- | --------------- | ---------------------------- |
| `/mcp`                                      | GET/POST/DELETE | MCP Streamable HTTP endpoint |
| `/health`                                   | GET             | Health check                 |
| `/authorize`                                | GET/POST        | OAuth authorization form     |
| `/token`                                    | POST            | OAuth token exchange         |
| `/.well-known/oauth-authorization-server`   | GET             | OAuth metadata               |
| `/.well-known/oauth-protected-resource/mcp` | GET             | Protected resource metadata  |

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

### Read-only Tool

Some MCP clients only expose tools that have the `readOnlyHint: true` annotation. For these clients, the server also exposes `productive_read`.

| Tool              | Description                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `productive`      | All resources and actions, reads and writes                                              |
| `productive_read` | Same routing and read parameters as `productive`, but only read actions (`readOnlyHint`) |

`productive_read` rejects the actions that change data (`create`, `update`, `delete`, `start`, `stop`, `reopen`, `complete_task`, `log_day`, and `resolve` on `discussions`). It also rejects a `batch` that contains one of these actions. Use the `productive` tool for writes.

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

### Raw API Tools

In addition to the unified `productive` tool, the server exposes two low-level tools for documented Productive API endpoints.

| Tool        | Description                                                                              |
| ----------- | ---------------------------------------------------------------------------------------- |
| `api_read`  | Read-only raw API access for documented `GET` endpoints                                  |
| `api_write` | Gated raw API write access for documented `POST`, `PATCH`, `PUT`, and `DELETE` endpoints |

#### `api_read`

Use `api_read` when you need a documented endpoint that is not yet covered by the higher-level `productive` tool.

**Parameters**

| Parameter   | Type     | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| `path`      | string   | Required relative API path, starting with `/`            |
| `describe`  | boolean  | Return endpoint docs instead of executing the request    |
| `filter`    | object   | Filter object, validated against the documented endpoint |
| `include`   | string[] | Related resources to include                             |
| `sort`      | string[] | Sort values, validated against the documented endpoint   |
| `page`      | number   | Page number                                              |
| `per_page`  | number   | Page size, max `200`                                     |
| `paginate`  | boolean  | Follow pagination automatically                          |
| `max_pages` | number   | Max pages when `paginate=true`, default `20`, max `50`   |

**Safety model**

- `GET` only
- Path must be relative and start with `/`
- Absolute URLs and path traversal are rejected
- Only documented Productive endpoints are allowed
- Filters and sort values are validated against the endpoint spec
- `describe=true` is the safest way to inspect an endpoint before calling it

**Examples**

```json
{
  "path": "/invoices",
  "describe": true
}
```

```json
{
  "path": "/projects/123/tasks",
  "filter": { "status": "open" },
  "sort": ["due_date"],
  "page": 1,
  "per_page": 50
}
```

```json
{
  "path": "/time_entries",
  "filter": { "person_id": ["me"], "after": "2025-01-01", "before": "2025-01-31" },
  "paginate": true,
  "max_pages": 5
}
```

#### `api_write`

Use `api_write` only when the higher-level `productive` tool does not expose the mutation you need.

**Parameters**

| Parameter | Type    | Description                                        |
| --------- | ------- | -------------------------------------------------- |
| `method`  | string  | Required, one of `POST`, `PATCH`, `PUT`, `DELETE`  |
| `path`    | string  | Required relative API path                         |
| `body`    | object  | Request body for write methods                     |
| `confirm` | boolean | Required, must be `true`                           |
| `dry_run` | boolean | Return the normalized request without executing it |

**Safety model**

- Disabled by default
- Requires `PRODUCTIVE_MCP_ENABLE_API_WRITE=true` on the server
- Requires `confirm=true` on every call
- Only documented Productive endpoints are allowed
- Path must be relative; absolute URLs and traversal are rejected
- `dry_run=true` lets you verify the exact method, path, and body before execution

To enable writes in local or remote deployments:

```bash
PRODUCTIVE_MCP_ENABLE_API_WRITE=true productive-mcp-server
```

**Examples**

```json
{
  "method": "PATCH",
  "path": "/tasks/123",
  "body": {
    "data": {
      "type": "tasks",
      "id": "123",
      "attributes": { "name": "Updated title" }
    }
  },
  "confirm": true,
  "dry_run": true
}
```

```json
{
  "method": "DELETE",
  "path": "/attachments/456",
  "confirm": true
}
```

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
