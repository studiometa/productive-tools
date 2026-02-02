# @studiometa/productive-mcp

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-mcp?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for [Productive.io](https://productive.io) API integration. Enables Claude Desktop and other MCP clients to interact with Productive.io for project management, time tracking, and task management.

## Features

- ✅ Full Productive.io API access via MCP
- 🔧 Support for projects, tasks, time entries, services, and people
- 🔐 Two modes: local (stdio) and remote (HTTP)
- 🔑 **OAuth 2.0 support** for Claude Desktop custom connectors
- 🌐 Deploy once, share with your team via Claude Desktop custom connectors
- 🐳 Docker-ready for easy deployment
- ⚡ **Token-optimized** - Single tool design minimizes context usage (~180 tokens)
- 📦 Built on [@studiometa/productive-cli](../productive-cli)

## Usage Modes

This package supports two modes:

| Mode              | Command                 | Use Case                                     |
| ----------------- | ----------------------- | -------------------------------------------- |
| **Local (stdio)** | `productive-mcp`        | Personal use via Claude Desktop config       |
| **Remote (HTTP)** | `productive-mcp-server` | Team use via Claude Desktop custom connector |

---

## Mode 1: Local (stdio) - Personal Use

Use this mode when you want to run the MCP server locally on your machine.

### Installation

```bash
npm install -g @studiometa/productive-mcp
```

### Claude Desktop Configuration

Edit your Claude Desktop config:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "productive": {
      "command": "productive-mcp"
    }
  }
}
```

Restart Claude Desktop, then ask Claude:

> "Configure my Productive.io credentials"

Claude will guide you through the setup.

### Alternative: Environment Variables

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

---

## Mode 2: Remote (HTTP) - Team Use

Deploy once, share with your entire team via Claude Desktop's **custom connector** feature.

### How It Works

The server supports **OAuth 2.0** for seamless Claude Desktop integration:

1. Deploy the HTTP server to a URL (e.g., `https://productive.mcp.example.com`)
2. Add the custom connector in Claude Desktop with OAuth enabled
3. When connecting, users are presented with a login form to enter their Productive credentials
4. Credentials are securely encrypted and exchanged via OAuth tokens

No central credential storage required - each user's credentials are encrypted directly in their OAuth token.

### Deploy the Server

#### Option A: Docker

```bash
# Build
docker build -t productive-mcp-server -f packages/productive-mcp/Dockerfile .

# Run
docker run -d \
  --name productive-mcp-server \
  --restart unless-stopped \
  -p 3000:3000 \
  productive-mcp-server
```

#### Option B: Node.js

```bash
npm install -g @studiometa/productive-mcp

# Start server
PORT=3000 productive-mcp-server
```

#### Option C: Docker Compose

```yaml
version: '3.8'

services:
  productive-mcp:
    build:
      context: .
      dockerfile: packages/productive-mcp/Dockerfile
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      PORT: 3000
      HOST: 0.0.0.0
      OAUTH_SECRET: 'your-random-secret-here' # Required for production!
```

### Environment Variables

| Variable       | Required             | Description                            |
| -------------- | -------------------- | -------------------------------------- |
| `PORT`         | No                   | Server port (default: 3000)            |
| `HOST`         | No                   | Bind address (default: 0.0.0.0)        |
| `OAUTH_SECRET` | **Yes (production)** | Secret key for encrypting OAuth tokens |

> ⚠️ **Important**: Always set `OAUTH_SECRET` in production. Generate a random secret:
>
> ```bash
> openssl rand -base64 32
> ```

### Configure Claude Desktop Custom Connector

1. Open Claude Desktop Settings
2. Go to **Custom Connectors** (beta)
3. Click **Add custom connector**
4. Configure:
   - **Name**: `Productive`
   - **Remote MCP server URL**: `https://productive.mcp.example.com/mcp`
   - **Authorization URL**: `https://productive.mcp.example.com/authorize`
   - **Token URL**: `https://productive.mcp.example.com/token`
5. Claude will redirect you to a login form to enter your Productive credentials
6. After login, you're connected and can start using Productive tools

### Alternative: Manual Bearer Token

If you prefer not to use OAuth, you can generate a Bearer token manually:

```bash
# Format: base64(organizationId:apiToken:userId)
echo -n "YOUR_ORG_ID:YOUR_API_TOKEN:YOUR_USER_ID" | base64
```

Example:

```bash
echo -n "12345:pk_abc123xyz:67890" | base64
# Output: MTIzNDU6cGtfYWJjMTIzeHl6OjY3ODkw
```

### Server Endpoints

| Endpoint                                  | Method | Description                         |
| ----------------------------------------- | ------ | ----------------------------------- |
| `/mcp`                                    | POST   | MCP JSON-RPC endpoint               |
| `/health`                                 | GET    | Health check                        |
| `/`                                       | GET    | Server info                         |
| `/authorize`                              | GET    | OAuth authorization (login form)    |
| `/authorize`                              | POST   | OAuth authorization (process login) |
| `/token`                                  | POST   | OAuth token exchange                |
| `/.well-known/oauth-authorization-server` | GET    | OAuth metadata                      |

---

## The `productive` Tool

The MCP server exposes a single unified tool optimized for minimal token usage:

```
productive(resource, action, ...)
```

### Resources & Actions

| Resource   | Actions                                     | Description        |
| ---------- | ------------------------------------------- | ------------------ |
| `projects` | `list`, `get`                               | Project management |
| `time`     | `list`, `get`, `create`, `update`, `delete` | Time tracking      |
| `tasks`    | `list`, `get`                               | Task management    |
| `services` | `list`                                      | Budget line items  |
| `people`   | `list`, `get`, `me`                         | Team members       |

### Parameters

| Parameter    | Type    | Description                                                             |
| ------------ | ------- | ----------------------------------------------------------------------- |
| `resource`   | string  | **Required**. One of: `projects`, `time`, `tasks`, `services`, `people` |
| `action`     | string  | **Required**. Action to perform (see table above)                       |
| `id`         | string  | Resource ID (required for `get`, `update`, `delete`)                    |
| `filter`     | object  | Filter criteria for `list` actions                                      |
| `page`       | number  | Page number for pagination                                              |
| `per_page`   | number  | Items per page (default: 20, max: 200)                                  |
| `compact`    | boolean | Compact output mode (default: true)                                     |
| `person_id`  | string  | Person ID (for time entry creation)                                     |
| `service_id` | string  | Service ID (for time entry creation)                                    |
| `time`       | number  | Time in minutes (for time entries)                                      |
| `date`       | string  | Date in YYYY-MM-DD format                                               |
| `note`       | string  | Note/description                                                        |

### Filter Options

#### Projects

- `company_id` - Filter by company
- `project_manager_id` - Filter by project manager

#### Time Entries

- `person_id` - Filter by person
- `project_id` - Filter by project
- `service_id` - Filter by service
- `after` - After date (YYYY-MM-DD)
- `before` - Before date (YYYY-MM-DD)

#### Tasks

- `project_id` - Filter by project
- `assignee_id` - Filter by assignee
- `task_list_id` - Filter by task list

#### Services

- `project_id` - Filter by project
- `deal_id` - Filter by deal

#### People

- `archived` - Include archived (boolean)

### Configuration Tools (Local mode only)

| Tool                    | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `productive_configure`  | Configure credentials (organizationId, apiToken, userId) |
| `productive_get_config` | View current configuration (token masked)                |

---

## Usage Examples

### First Time Setup (Local Mode)

```
You: "Configure my Productive.io credentials"
Claude: "I'll help you set up. Please provide your Organization ID and API Token..."
```

### List Projects

```
You: "Show me all projects"
Claude uses: productive(resource="projects", action="list")
```

### Get Project Details

```
You: "Get details for project 12345"
Claude uses: productive(resource="projects", action="get", id="12345")
```

### Create Time Entry

```
You: "Log 2 hours today on service 456"
Claude uses: productive(resource="time", action="create", person_id="...", service_id="456", time=120, date="2024-01-15")
```

### List My Time Entries

```
You: "What did I work on last week?"
Claude uses: productive(resource="time", action="list", filter={person_id: "...", after: "2024-01-08", before: "2024-01-14"})
```

### Get Current User

```
You: "Who am I logged in as?"
Claude uses: productive(resource="people", action="me")
```

### List Tasks for a Project

```
You: "Show tasks for project 789"
Claude uses: productive(resource="tasks", action="list", filter={project_id: "789"})
```

---

## Get Your Productive.io Credentials

1. Log into [Productive.io](https://productive.io)
2. Go to **Settings → Integrations → API**
3. Generate an API token
4. Note your Organization ID (visible in URL or API settings)
5. Note your User ID (click your profile, visible in URL)

---

## Development

```bash
# Clone the repository
git clone https://github.com/studiometa/productive-tools
cd productive-tools

# Install dependencies
npm install

# Build all packages
npm run build

# Or build only MCP package
npm run build -w @studiometa/productive-mcp

# Development mode (watch)
npm run dev -w @studiometa/productive-mcp

# Run tests
npm test -w @studiometa/productive-mcp

# Test local server
node packages/productive-mcp/dist/index.js

# Test HTTP server
node packages/productive-mcp/dist/server.js
```

### Testing the HTTP Server

```bash
# Start the server
PORT=3000 node packages/productive-mcp/dist/server.js

# Generate a test token
TOKEN=$(echo -n "YOUR_ORG_ID:YOUR_API_TOKEN:YOUR_USER_ID" | base64)

# Test health endpoint
curl http://localhost:3000/health

# Test MCP endpoint - list tools
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'

# List projects
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"productive","arguments":{"resource":"projects","action":"list"}},"id":2}'

# Get a specific project
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"productive","arguments":{"resource":"projects","action":"get","id":"12345"}},"id":3}'
```

---

## Troubleshooting

### Local mode: Credentials not found

```bash
# Check environment variables
echo $PRODUCTIVE_ORG_ID
echo $PRODUCTIVE_API_TOKEN

# Or use the configure tool via Claude
```

### HTTP mode: 401 Unauthorized

- Verify your token is correctly base64-encoded
- Check that orgId:apiToken:userId are separated by colons
- Ensure no newlines in the base64 output

### Docker: View logs

```bash
docker logs productive-mcp-server -f
```

### Test server manually (local mode)

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | productive-mcp
```

---

## Requirements

- Node.js 20+
- Productive.io account with API access
- Docker (optional, for server deployment)

## Architecture

```
productive-mcp/
├── src/
│   ├── index.ts      # Stdio transport (local mode)
│   ├── server.ts     # HTTP transport (remote mode)
│   ├── http.ts       # HTTP routes and MCP endpoint
│   ├── oauth.ts      # OAuth 2.0 endpoints
│   ├── crypto.ts     # Encryption for stateless OAuth tokens
│   ├── tools.ts      # Tool definitions (single unified tool)
│   ├── handlers.ts   # Tool execution logic
│   ├── formatters.ts # Response formatting with compact mode
│   └── auth.ts       # Bearer token parsing
├── Dockerfile
└── README.md
```

### Token Optimization

The server uses a single unified `productive` tool instead of multiple individual tools. This reduces the tool schema from ~1300 tokens to ~180 tokens (86% reduction), which:

- Reduces context window usage
- Minimizes compaction frequency
- Improves response times

### OAuth Flow (Stateless)

The OAuth implementation is **stateless** - no database or session storage required:

1. User visits `/authorize` → sees login form
2. User enters Productive credentials (org ID, API token, user ID)
3. Server encrypts credentials into the authorization code using `OAUTH_SECRET`
4. Redirects back to Claude with the encrypted code
5. Claude calls `/token` with the code
6. Server decrypts the code → returns access token (base64 credentials)
7. All MCP requests include this token in the `Authorization: Bearer` header

This approach keeps the server stateless while securely passing credentials through the OAuth flow.

## Related Packages

- [@studiometa/productive-cli](../productive-cli) - CLI tool for Productive.io
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - Official MCP SDK
- [h3](https://github.com/unjs/h3) - HTTP framework for the server

## License

MIT © [Studio Meta](https://www.studiometa.fr)

## Links

- [GitHub Repository](https://github.com/studiometa/productive-tools)
- [Productive.io API Docs](https://developer.productive.io)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude Desktop Custom Connectors](https://docs.anthropic.com)
- [Issues](https://github.com/studiometa/productive-tools/issues)
