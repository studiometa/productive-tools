# @studiometa/productive-cli

[![CI](https://github.com/studiometa/productive-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/studiometa/productive-cli/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/studiometa/productive-cli/branch/main/graph/badge.svg)](https://codecov.io/gh/studiometa/productive-cli)
[![npm version](https://badge.fury.io/js/@studiometa%2Fproductive-cli.svg)](https://www.npmjs.com/package/@studiometa/productive-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful CLI tool for interacting with the Productive.io API, optimized for both AI agents and human users.

## ✨ Features

- 🤖 **AI-Optimized**: JSON output format for easy parsing by AI agents
- 👥 **Human-Friendly**: Beautiful formatted output with colors and progress indicators
- 📦 **Zero Dependencies**: Built entirely with native Node.js APIs
- 🚀 **Fast & Reliable**: Uses native fetch, built with Vite
- 🔒 **Secure**: API credentials stored locally with XDG compliance
- 📊 **Multiple Output Formats**: JSON, CSV, Table, Human-readable
- ✅ **Well-Tested**: Comprehensive test coverage with Vitest
- 🤖 **CI/CD Ready**: GitHub Actions workflows included

## 📋 Requirements

- **Node.js 24+** (uses native fetch and other modern features)

## 🚀 Installation

```bash
npm install -g @studiometa/productive-cli
```

Or use directly with npx:

```bash
npx @studiometa/productive-cli
```

## ⚙️ Configuration

### Method 1: Environment Variables (Recommended for CI/CD)

```bash
export PRODUCTIVE_API_TOKEN=your_api_token
export PRODUCTIVE_ORG_ID=your_organization_id
export PRODUCTIVE_USER_ID=your_user_id
```

### Method 2: CLI Configuration

```bash
# Set your API token
productive config set apiToken YOUR_API_TOKEN

# Set your organization ID
productive config set organizationId YOUR_ORG_ID

# Set your user ID (for time entries)
productive config set userId YOUR_USER_ID

# Verify configuration
productive config validate
```

### Configuration Storage

Configuration is stored in XDG-compliant locations:
- **Linux/Unix**: `$XDG_CONFIG_HOME/productive-cli/config.json` (defaults to `~/.config`)
- **macOS**: `$XDG_CONFIG_HOME/productive-cli/config.json` or `~/Library/Application Support/productive-cli/config.json`
- **Windows**: `%APPDATA%\productive-cli\config.json`

## 📖 Usage

### Output Formats

All commands support multiple output formats via the `--format` flag:

- `json` - Structured JSON output (ideal for AI agents)
- `human` - Formatted, colored output (default, for humans)
- `csv` - Comma-separated values
- `table` - ASCII table format

Example:
```bash
# For AI agents
productive projects list --format json

# For humans (default)
productive projects list

# Export to CSV
productive projects list --format csv > projects.csv
```

### Projects

```bash
# List all active projects
productive projects list

# List with pagination
productive projects list --page 2 --size 50

# Include archived projects
productive projects list --archived

# Sort results
productive projects list --sort name

# JSON output for AI agents
productive projects list --format json

# Get specific project
productive projects get <project-id>

# Short alias
productive p ls
```

### Time Entries

```bash
# List time entries
productive time list

# Filter by date range
productive time list --from 2024-01-01 --to 2024-01-31

# Filter by person or project
productive time list --person <person-id>
productive time list --project <project-id>

# Create time entry (uses configured userId by default)
productive time add \
  --service <service-id> \
  --date 2024-01-16 \
  --time 480 \
  --note "Development work"

# Create for specific person
productive time add \
  --person <person-id> \
  --service <service-id> \
  --time 240

# Update time entry
productive time update <entry-id> --time 360 --note "Updated note"

# Delete time entry
productive time delete <entry-id>

# Get specific time entry
productive time get <entry-id>

# Short alias
productive t ls
```

### Tasks

```bash
# List active tasks
productive tasks list

# Show completed tasks
productive tasks list --completed

# Show all tasks
productive tasks list --all

# Filter by project
productive tasks list --project <project-id>

# Get specific task
productive tasks get <task-id>
```

### People

```bash
# List active people
productive people list

# Include inactive people
productive people list --all

# Get specific person
productive people get <person-id>
```

### Services

```bash
# List all services
productive services list

# JSON output
productive services list --format json
```

### Budgets

```bash
# List all budgets
productive budgets list

# Filter by project
productive budgets list --project <project-id>
```

## 🤖 AI Agent Integration

This CLI is specifically optimized for AI agents. See [AI_AGENT_GUIDE.md](./AI_AGENT_GUIDE.md) for detailed integration instructions.

### Quick Example

```bash
# Get structured JSON output
productive projects list --format json

# Response format:
{
  "data": [
    {
      "id": "123",
      "name": "Project Name",
      "project_number": "PRJ-001",
      "archived": false,
      ...
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 100,
    "total": 50
  }
}
```

### Error Handling

Errors are returned in a consistent JSON format when using `--format json`:

```json
{
  "error": "ProductiveApiError",
  "message": "API request failed: 401 Unauthorized",
  "statusCode": 401
}
```

### Exit Codes

- `0` - Success
- `1` - Error (API error, validation error, etc.)

## 🛠️ Development

### Setup

```bash
# Clone repository
git clone https://github.com/studiometa/productive-cli.git
cd productive-cli

# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:ci

# Watch mode
npm test -- --watch
```

### Linting and Formatting

```bash
# Lint code with oxlint
npm run lint

# Format code with oxc
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck
```

### Stack

- **Runtime**: Node.js 24+ (native APIs only)
- **Build**: Vite 6
- **Language**: TypeScript 5
- **Testing**: Vitest 2
- **Linting**: oxlint
- **Formatting**: oxfmt
- **CI/CD**: GitHub Actions

## 📚 API Library Usage

The CLI can also be used as a library:

```typescript
import { ProductiveApi, getConfig, setConfig } from '@studiometa/productive-cli';

// Configure
setConfig('apiToken', 'your-token');
setConfig('organizationId', 'your-org-id');
setConfig('userId', 'your-user-id');

// Use API
const api = new ProductiveApi();

// Get projects
const projects = await api.getProjects({
  filter: { archived: 'false' },
  page: 1,
  perPage: 100,
});

// Create time entry
const timeEntry = await api.createTimeEntry({
  person_id: 'person-id',
  service_id: 'service-id',
  date: '2024-01-16',
  time: 480,
  note: 'Development work',
});
```

## 🌍 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PRODUCTIVE_API_TOKEN` | Your Productive.io API token | Yes |
| `PRODUCTIVE_ORG_ID` | Your organization ID | Yes |
| `PRODUCTIVE_USER_ID` | Your user ID | Yes* |
| `PRODUCTIVE_BASE_URL` | Custom API base URL | No |
| `XDG_CONFIG_HOME` | Custom config directory | No |
| `NO_COLOR` | Disable colored output | No |

\* Required only for time entry operations

## 📝 License

MIT © [Studio Meta](https://www.studiometa.fr/)

## 🔗 Links

- [Productive.io API Documentation](https://developer.productive.io/)
- [GitHub Repository](https://github.com/studiometa/productive-cli)
- [npm Package](https://www.npmjs.com/package/@studiometa/productive-cli)
- [Studio Meta](https://www.studiometa.fr/)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

## 🙏 Acknowledgments

Built with ❤️ by [Studio Meta](https://www.studiometa.fr/) using native Node.js APIs.
