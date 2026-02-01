# @studiometa/productive-mcp

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-mcp?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for [Productive.io](https://productive.io) API integration. Enables Claude Desktop and other MCP clients to interact with Productive.io for project management, time tracking, and task management.

## Features

- ✅ Full Productive.io API access via MCP
- 🔧 Support for projects, tasks, time entries, services, and people
- 🔐 Two modes: local (stdio) and remote (HTTP)
- 🌐 Deploy once, share with your team via Claude Desktop custom connectors
- 🐳 Docker-ready for easy deployment
- 📦 Built on [@studiometa/productive-cli](../productive-cli)

## Usage Modes

This package supports two modes:

| Mode | Command | Use Case |
|------|---------|----------|
| **Local (stdio)** | `productive-mcp` | Personal use via Claude Desktop config |
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

1. Deploy the HTTP server to a URL (e.g., `https://productive.mcp.example.com`)
2. Each team member generates their own Bearer token with their Productive credentials
3. Team members add the custom connector in Claude Desktop with their personal token

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
      - "3000:3000"
    environment:
      PORT: 3000
      HOST: 0.0.0.0
```

### Generate Your Token

Each team member generates their own token containing their Productive credentials:

```bash
# Format: base64(organizationId:apiToken:userId)
echo -n "YOUR_ORG_ID:YOUR_API_TOKEN:YOUR_USER_ID" | base64
```

Example:
```bash
echo -n "12345:pk_abc123xyz:67890" | base64
# Output: MTIzNDU6cGtfYWJjMTIzeHl6OjY3ODkw
```

### Configure Claude Desktop Custom Connector

1. Open Claude Desktop Settings
2. Go to **Custom Connectors** (beta)
3. Click **Add custom connector**
4. Configure:
   - **Name**: `Productive`
   - **Remote MCP server URL**: `https://productive.mcp.example.com/mcp`
   - Leave OAuth fields empty (we use Bearer token)
5. When making requests, Claude will include your token in the `Authorization` header

> **Note**: As of now, Claude Desktop custom connectors may require OAuth. If Bearer token auth isn't supported directly, you can use a reverse proxy to inject the Authorization header, or wait for Claude Desktop to support custom headers.

### Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | POST | MCP JSON-RPC endpoint |
| `/health` | GET | Health check |
| `/` | GET | Server info |

---

## Available Tools

### Projects
- `productive_list_projects` - List projects with optional filters
- `productive_get_project` - Get project details by ID

### Tasks
- `productive_list_tasks` - List tasks with optional filters
- `productive_get_task` - Get task details by ID

### Time Entries
- `productive_list_time_entries` - List time entries with filters
- `productive_get_time_entry` - Get time entry details by ID
- `productive_create_time_entry` - Create a new time entry
- `productive_update_time_entry` - Update an existing time entry
- `productive_delete_time_entry` - Delete a time entry

### Services
- `productive_list_services` - List services (budget line items)

### People
- `productive_list_people` - List people in the organization
- `productive_get_person` - Get person details by ID
- `productive_get_current_user` - Get current authenticated user

### Configuration (Local mode only)
- `productive_configure` - Configure credentials
- `productive_get_config` - View current configuration

---

## Get Your Productive.io Credentials

1. Log into [Productive.io](https://productive.io)
2. Go to **Settings → Integrations → API**
3. Generate an API token
4. Note your Organization ID (visible in URL or API settings)
5. Note your User ID (click your profile, visible in URL)

---

## Usage Examples

### First Time Setup (Local Mode)

```
You: "Configure my Productive.io credentials"
Claude: "I'll help you set up. Please provide your Organization ID and API Token..."
```

### Common Queries

- "Show me all active projects in Productive"
- "Create a time entry for 2 hours today on project X"
- "List all tasks assigned to me"
- "What did I work on last week?"
- "Show me the services/budgets for project 12345"

---

## Development

```bash
# Clone the repository
git clone https://github.com/studiometa/productive-cli
cd productive-cli

# Install dependencies
npm install

# Build all packages
npm run build

# Or build only MCP package
npm run build -w @studiometa/productive-mcp

# Development mode (watch)
npm run dev -w @studiometa/productive-mcp

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

# Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'

# List projects
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"productive_list_projects","arguments":{}},"id":2}'
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
│   ├── tools.ts      # Tool definitions (shared)
│   ├── handlers.ts   # Tool execution (shared)
│   └── auth.ts       # Bearer token parsing
├── Dockerfile
└── README.md
```

## Related Packages

- [@studiometa/productive-cli](../productive-cli) - CLI tool for Productive.io
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - Official MCP SDK
- [h3](https://github.com/unjs/h3) - HTTP framework for the server

## License

MIT © [Studio Meta](https://www.studiometa.fr)

## Links

- [GitHub Repository](https://github.com/studiometa/productive-cli)
- [Productive.io API Docs](https://developer.productive.io)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude Desktop Custom Connectors](https://docs.anthropic.com)
- [Issues](https://github.com/studiometa/productive-cli/issues)
