# @studiometa/productive-cli

[![npm version](https://img.shields.io/npm/v/@studiometa/productive-cli?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-cli)
[![Downloads](https://img.shields.io/npm/dm/@studiometa/productive-cli?style=flat&colorB=3e63dd&colorA=414853)](https://www.npmjs.com/package/@studiometa/productive-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat&colorB=3e63dd&colorA=414853)](https://opensource.org/licenses/MIT)

CLI tool for interacting with the [Productive.io](https://productive.io) API. Optimized for both AI agents and human users.

## Installation

```bash
npm install -g @studiometa/productive-cli

# Or use directly with npx
npx @studiometa/productive-cli --help
```

## Configuration

Credentials can be provided in three ways (highest priority first):

1. **CLI arguments**: `--token`, `--org-id`, `--user-id`
2. **Environment variables**: `PRODUCTIVE_API_TOKEN`, `PRODUCTIVE_ORG_ID`, `PRODUCTIVE_USER_ID`
3. **Config file** (persistent, with secure keychain storage):

```bash
productive config set apiToken YOUR_TOKEN
productive config set organizationId YOUR_ORG_ID
productive config set userId YOUR_USER_ID

productive config validate
```

API tokens are stored in the system keychain when available (macOS Keychain, Linux libsecret).

## Commands

```
productive <command> [subcommand] [options]
```

| Command      | Alias | Description                                                  |
| ------------ | ----- | ------------------------------------------------------------ |
| `config`     |       | Manage CLI configuration (`set`, `get`, `validate`, `clear`) |
| `projects`   | `p`   | List and get projects                                        |
| `time`       | `t`   | List, get, create, update, delete time entries               |
| `tasks`      |       | List, get, create, update tasks                              |
| `people`     |       | List and get people                                          |
| `services`   | `svc` | List services                                                |
| `budgets`    |       | List budgets                                                 |
| `companies`  |       | List, get, create, update companies                          |
| `comments`   |       | List, get, create, update comments                           |
| `timers`     |       | List, get, start, stop timers                                |
| `deals`      |       | List, get, create, update deals                              |
| `bookings`   |       | List, get, create, update bookings                           |
| `reports`    |       | Generate reports (time, project, budget, person)             |
| `resolve`    |       | Resolve human-friendly IDs (email, project number)           |
| `api`        |       | Make custom authenticated API requests                       |
| `cache`      |       | Manage CLI cache (`status`, `clear`)                         |
| `completion` |       | Generate shell completions (`bash`, `zsh`, `fish`)           |

Run `productive <command> --help` for detailed usage of each command.

## Output Formats

All list/get commands support `--format`:

| Format | Flag             | Description                          |
| ------ | ---------------- | ------------------------------------ |
| Human  | `--format human` | Colored, readable output (default)   |
| JSON   | `--format json`  | Structured JSON for programmatic use |
| CSV    | `--format csv`   | Comma-separated values               |
| Table  | `--format table` | ASCII table                          |

```bash
productive projects list --format json
productive time list --format csv > time.csv
```

## Smart ID Resolution

Use human-friendly identifiers instead of numeric IDs:

```bash
# Emails → person ID
productive time list --person "john@company.com"

# Project numbers → project ID
productive tasks list --project "PRJ-123"

# Explicit resolve
productive resolve "user@example.com"
```

## Custom API Requests

For endpoints not covered by built-in commands:

```bash
# GET
productive api /projects --field 'filter[archived]=false'

# POST (auto-detected when fields are provided)
productive api /time_entries \
  --field person_id=12345 \
  --field service_id=67890 \
  --field date=2025-01-15 \
  --field time=480

# PATCH
productive api /time_entries/123456 --method PATCH --field time=240

# Paginate all results
productive api /time_entries --paginate
```

## Global Options

| Option            | Alias | Description                                    |
| ----------------- | ----- | ---------------------------------------------- |
| `--format <fmt>`  | `-f`  | Output format: `json`, `human`, `csv`, `table` |
| `--page <num>`    | `-p`  | Page number                                    |
| `--size <num>`    | `-s`  | Items per page (default: 100)                  |
| `--sort <field>`  |       | Sort field (prefix with `-` for descending)    |
| `--no-color`      |       | Disable colored output                         |
| `--token <token>` |       | API token override                             |
| `--org-id <id>`   |       | Organization ID override                       |
| `--user-id <id>`  |       | User ID override                               |

## AI Agent Integration

The CLI is designed for programmatic use by AI agents. See the [AI agent integration guide](../../CLAUDE.md) in the repository root for detailed workflows, response schemas, and examples.

Key features:

- Structured JSON output with `--format json`
- Consistent error format with status codes
- Standard exit codes (0 = success, 1 = error)
- Non-interactive, fully scriptable

## Library Usage

The CLI can also be used as a Node.js library:

```typescript
import { ProductiveApi, getConfig, setConfig } from '@studiometa/productive-cli';

setConfig('apiToken', 'your-token');
setConfig('organizationId', 'your-org-id');

const api = new ProductiveApi();
const projects = await api.getProjects({ page: 1, perPage: 50 });
```

## License

MIT © [Studio Meta](https://www.studiometa.fr)
