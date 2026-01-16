# 📊 @studiometa/productive-cli

[![CI](https://github.com/studiometa/productive-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/studiometa/productive-cli/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/studiometa/productive-cli/branch/main/graph/badge.svg)](https://codecov.io/gh/studiometa/productive-cli)
[![npm version](https://img.shields.io/npm/v/@studiometa/productive-cli?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-cli)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/productive-cli?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

> Powerful CLI tool for interacting with the [Productive.io](https://productive.io) API. Optimized for both AI agents and human users with zero dependencies.

## ✨ Features

- 🤖 **AI-Optimized** — JSON output format for easy parsing by AI agents
- 👥 **Human-Friendly** — Beautiful formatted output with colors and progress indicators
- 📦 **Zero Dependencies** — Built entirely with native Node.js APIs (fetch, streams, file system)
- 🚀 **Fast & Reliable** — Native implementation, no external HTTP libraries
- 🔒 **Secure** — Credentials stored locally with XDG compliance
- 📊 **Multiple Formats** — JSON, CSV, Table, or Human-readable output
- ✅ **Well-Tested** — 92.38% coverage with 210 tests
- 🔧 **Type-Safe** — Written in TypeScript with full type definitions

## Requirements

- **Node.js 24+** (uses native fetch and other modern APIs)
- **Productive.io account** with API access

## Installation

```bash
# Install globally
npm install -g @studiometa/productive-cli

# Or use directly with npx
npx @studiometa/productive-cli --help
```

## Quick Start

### 1. Get Your API Credentials

1. Log into your [Productive.io](https://productive.io) account
2. Go to Settings → Integrations → API
3. Generate an API token
4. Note your Organization ID and User ID

### 2. Configure the CLI

You have three ways to provide credentials (in order of priority):

```bash
# Option 1: Pass directly via CLI arguments (highest priority)
productive projects list --token YOUR_TOKEN --org-id YOUR_ORG_ID

# Option 2: Environment variables (for CI/CD)
export PRODUCTIVE_API_TOKEN="your-api-token"
export PRODUCTIVE_ORG_ID="your-organization-id"
export PRODUCTIVE_USER_ID="your-user-id"

# Option 3: Persistent configuration (for local use)
productive config set apiToken YOUR_API_TOKEN
productive config set organizationId YOUR_ORG_ID
productive config set userId YOUR_USER_ID

# Verify configuration
productive config validate
```

**Credential Priority:**
1. CLI arguments (`--token`, `--org-id`, `--user-id`)
2. Environment variables (`PRODUCTIVE_API_TOKEN`, `PRODUCTIVE_ORG_ID`, `PRODUCTIVE_USER_ID`)
3. Config file (`~/.config/productive-cli/config.json`)

### 3. Start Using

```bash
# List projects
productive projects list

# Get time entries for this month
productive time list --from 2024-01-01 --to 2024-01-31

# JSON output for AI agents
productive projects list --format json

# Export to CSV
productive time list --format csv > time-entries.csv
```

## Usage

### Commands Overview

```bash
productive <command> [subcommand] [options]

Available commands:
  config       Manage configuration
  projects     Manage projects
  time         Manage time entries
  tasks        Manage tasks
  people       Manage people
  services     Manage services
  budgets      Manage budgets
```

### Configuration

```bash
# Set values
productive config set apiToken <token>
productive config set organizationId <id>
productive config set userId <id>

# Get values
productive config get              # Show all configuration
productive config get apiToken     # Show specific value

# Validate configuration
productive config validate

# Clear all configuration
productive config clear
```

**Configuration Location:**
- **Linux/Unix**: `~/.config/productive-cli/config.json`
- **macOS**: `~/Library/Application Support/productive-cli/config.json`
- **Windows**: `%APPDATA%\productive-cli\config.json`

### Projects

```bash
# List all projects
productive projects list
productive p ls                    # Short alias

# Pagination
productive projects list --page 2 --size 50

# Sort results
productive projects list --sort name
productive projects list --sort -created_at  # Descending

# JSON output
productive projects list --format json

# CSV export
productive projects list --format csv > projects.csv

# Get specific project
productive projects get <project-id>
```

### Time Entries

```bash
# List time entries
productive time list
productive t ls                    # Short alias

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
  --time 240 \
  --note "Meeting"

# Update time entry
productive time update <entry-id> --time 360 --note "Updated note"

# Delete time entry
productive time delete <entry-id>
productive time rm <entry-id>      # Short alias

# Get specific time entry
productive time get <entry-id>
```

**Time Values:**
- Time is specified in **minutes**
- Example: `--time 480` = 8 hours
- Example: `--time 90` = 1.5 hours

### Tasks

```bash
# List all tasks
productive tasks list

# Filter by project
productive tasks list --project <project-id>

# Get specific task
productive tasks get <task-id>
```

### People

```bash
# List all people
productive people list

# Get specific person
productive people get <person-id>
```

### Services

```bash
# List all services
productive services list
productive svc ls                  # Short alias

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

### Global Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--format <fmt>` | `-f` | Output format: `json`, `human`, `csv`, `table` | `human` |
| `--page <num>` | `-p` | Page number for pagination | `1` |
| `--size <num>` | `-s` | Items per page | `100` |
| `--sort <field>` | | Sort by field (prefix with `-` for descending) | |
| `--no-color` | | Disable colored output | |
| `--help` | `-h` | Show help | |
| `--version` | `-v` | Show version | |

### Authentication Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--token <token>` | `--api-token` | API token (overrides config and env) |
| `--org-id <id>` | `--organization-id` | Organization ID (overrides config and env) |
| `--user-id <id>` | | User ID (overrides config and env) |
| `--base-url <url>` | | Custom API base URL |

### Output Formats

#### Human (Default)
Beautiful, colored output optimized for terminal viewing:

```bash
productive projects list
```

```
✓ Fetched projects

Build | Artflo [active]
  ID: 601954
  Number: 326
  Budget: $50,000.00
  Created: 2024-12-09

Build | Beaulac [active]
  ID: 428928
  Number: 113
  Budget: $75,000.00
  Created: 2024-02-01

Page 1/120 (Total: 358 projects)
```

#### JSON (AI-Optimized)
Structured JSON for programmatic consumption:

```bash
productive projects list --format json
```

```json
{
  "data": [
    {
      "id": "601954",
      "name": "Build | Artflo",
      "project_number": "326",
      "archived": false,
      "budget": 50000.00,
      "created_at": "2024-12-09T11:11:07.434+01:00",
      "updated_at": "2024-12-09T11:11:07.434+01:00"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 100,
    "total": 358
  }
}
```

#### CSV (Spreadsheet Export)
Comma-separated values for Excel/Google Sheets:

```bash
productive time list --format csv > time-entries.csv
```

#### Table (ASCII Table)
Clean table format for reports:

```bash
productive projects list --format table
```

## 🤖 AI Agent Integration

This CLI is specifically optimized for AI agents and automation tools. For comprehensive documentation, see [AGENTS.md](./AGENTS.md).

### Key Features for AI Agents

1. **Structured JSON Output** — All commands support `--format json` with predictable schemas
2. **Consistent Error Format** — Errors are returned as JSON with status codes
3. **Exit Codes** — `0` for success, `1` for errors (scriptable)
4. **Zero Interactivity** — All commands are non-interactive and scriptable
5. **Environment Variables** — No need for interactive configuration

### Example AI Integration

```bash
# Pass credentials directly (no config needed)
TOKEN="your-api-token"
ORG_ID="your-org-id"
USER_ID="your-user-id"

# Get projects as JSON
projects=$(productive projects list \
  --token "$TOKEN" \
  --org-id "$ORG_ID" \
  --format json)

# Parse with jq
project_id=$(echo "$projects" | jq -r '.data[0].id')

# Create time entry with inline credentials
productive time add \
  --token "$TOKEN" \
  --org-id "$ORG_ID" \
  --user-id "$USER_ID" \
  --service 123456 \
  --date $(date +%Y-%m-%d) \
  --time 480 \
  --note "AI-generated time entry" \
  --format json

# Handle errors
if [ $? -eq 0 ]; then
  echo "Success"
else
  echo "Failed"
  exit 1
fi
```

### Error Handling

Errors are returned in consistent JSON format when using `--format json`:

```json
{
  "error": "ProductiveApiError",
  "message": "API request failed: 401 Unauthorized",
  "statusCode": 401
}
```

## API Library

You can also use the CLI as a library in your Node.js applications:

```bash
npm install @studiometa/productive-cli
```

```typescript
import { ProductiveApi, getConfig, setConfig } from '@studiometa/productive-cli';

// Configure
setConfig('apiToken', 'your-token');
setConfig('organizationId', 'your-org-id');
setConfig('userId', 'your-user-id');

// Initialize API client
const api = new ProductiveApi();

// Get projects
const projects = await api.getProjects({
  filter: {},
  page: 1,
  perPage: 100,
});

console.log(projects.data);

// Create time entry
const timeEntry = await api.createTimeEntry({
  person_id: 'person-id',
  service_id: 'service-id',
  date: '2024-01-16',
  time: 480,
  note: 'Development work',
});

console.log(timeEntry.data);
```

### Available API Methods

```typescript
// Projects
api.getProjects(params?)
api.getProject(id)

// Time Entries
api.getTimeEntries(params?)
api.getTimeEntry(id)
api.createTimeEntry(data)
api.updateTimeEntry(id, data)
api.deleteTimeEntry(id)

// Tasks
api.getTasks(params?)
api.getTask(id)

// People
api.getPeople(params?)
api.getPerson(id)

// Services
api.getServices(params?)

// Budgets
api.getBudgets(params?)
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PRODUCTIVE_API_TOKEN` | Your Productive.io API token | Yes |
| `PRODUCTIVE_ORG_ID` | Your organization ID | Yes |
| `PRODUCTIVE_USER_ID` | Your user ID (for time entries) | Yes* |
| `PRODUCTIVE_BASE_URL` | Custom API base URL | No |
| `XDG_CONFIG_HOME` | Custom config directory | No |
| `NO_COLOR` | Disable colored output | No |

\* Required only for time entry creation

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/studiometa/productive-cli.git
cd productive-cli

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:ci

# Lint code
npm run lint

# Type check
npm run typecheck
```

### Technology Stack

- **Runtime**: Node.js 24+ (native APIs only - fetch, streams, fs, crypto)
- **Language**: TypeScript 5
- **Build**: Vite 6
- **Testing**: Vitest 2 (92.38% coverage)
- **Linting**: oxlint (fast, modern linter)
- **Formatting**: oxfmt
- **CI/CD**: GitHub Actions

### Project Structure

```
productive-cli/
├── src/
│   ├── api.ts                 # API client implementation
│   ├── cli.ts                 # CLI entry point
│   ├── config.ts              # Configuration management
│   ├── output.ts              # Output formatters
│   ├── types.ts               # TypeScript type definitions
│   ├── commands/              # Command handlers
│   │   ├── budgets.ts
│   │   ├── config.ts
│   │   ├── people.ts
│   │   ├── projects.ts
│   │   ├── services.ts
│   │   ├── tasks.ts
│   │   └── time.ts
│   ├── utils/                 # Utility functions
│   │   ├── args.ts           # Argument parser
│   │   ├── colors.ts         # Terminal colors
│   │   ├── config-store.ts   # Config file handling
│   │   └── spinner.ts        # Loading spinner
│   └── __tests__/             # Test files
├── dist/                      # Built files
├── scripts/                   # Build scripts
├── .github/                   # GitHub Actions workflows
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Running Tests

```bash
# Run tests once
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:ci

# Coverage report is generated in ./coverage/
```

### Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting: `npm test && npm run lint && npm run typecheck`
6. Commit with clear messages: `git commit -m "feat: add amazing feature"`
7. Push and open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `chore:` Maintenance tasks
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `ci:` CI/CD changes

## Troubleshooting

### Common Issues

#### "Configuration not found"

Make sure you've configured your credentials:

```bash
productive config set apiToken YOUR_TOKEN
productive config set organizationId YOUR_ORG_ID
productive config set userId YOUR_USER_ID
```

Or use environment variables:

```bash
export PRODUCTIVE_API_TOKEN="your-token"
export PRODUCTIVE_ORG_ID="your-org-id"
export PRODUCTIVE_USER_ID="your-user-id"
```

#### "API request failed: 401 Unauthorized"

Your API token is invalid or expired. Generate a new one in Productive.io settings.

#### "Person ID required"

For time entry creation, you need to set your user ID:

```bash
productive config set userId YOUR_USER_ID
```

Or specify it in the command:

```bash
productive time add --person YOUR_USER_ID --service SERVICE_ID --time 480
```

### Debug Mode

Set environment variable for verbose output:

```bash
DEBUG=productive:* productive projects list
```

## Security

- **Local Storage**: Credentials are stored locally in XDG-compliant directories
- **No External Services**: All data stays between your machine and Productive.io
- **HTTPS Only**: All API requests use HTTPS
- **Token-Based Auth**: Secure token authentication with Productive.io

**Security Best Practices:**
1. Never commit your API token to version control
2. Use environment variables in CI/CD environments
3. Regularly rotate your API tokens
4. Restrict token permissions in Productive.io settings

## Resources

- 📖 [Productive.io API Documentation](https://developer.productive.io/)
- 🤖 [AI Agent Integration Guide](./AGENTS.md)
- 📝 [Contributing Guide](./CONTRIBUTING.md)
- 📋 [Changelog](./CHANGELOG.md)
- 🐛 [Issue Tracker](https://github.com/studiometa/productive-cli/issues)
- 💬 [Discussions](https://github.com/studiometa/productive-cli/discussions)
- 🏢 [Studio Meta](https://www.studiometa.fr/)

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Contributors

Thanks to all contributors who have helped improve this project!

<!-- Contributors will be automatically added here -->

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release notes and version history.

## License

[MIT](./LICENSE) © [Studio Meta](https://www.studiometa.fr/)

---

<p align="center">
  Built with ❤️ by <a href="https://www.studiometa.fr/">Studio Meta</a> using native Node.js APIs
</p>
