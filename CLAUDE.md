# Claude Instructions

## Git & Commits

- Commit messages: English, simple verb-first sentences (e.g., "Add...", "Fix...", "Update...")
- Always add `Co-authored-by: Claude <claude@anthropic.com>` trailer
- **Tags**: Do NOT use `v` prefix (use `0.4.0` not `v0.4.0`)
- **Releases**: Do NOT create GitHub releases manually with `gh release create` - they are created automatically by GitHub Actions when a tag is pushed

## Changelog

- **Single changelog** at root (`CHANGELOG.md`) for the entire monorepo
- Prefix entries with package name when relevant: `**CLI**: ...`, `**MCP**: ...`
- Use `[hash]` format for commit references (not bare hashes)
- Use `[#N]` format for PR references (GitHub style, not `!N` GitLab style)
- Add link definitions at the bottom of the file:
  - Commits: `[hash]: https://github.com/studiometa/productive-tools/commit/hash`
  - PRs: `[#N]: https://github.com/studiometa/productive-tools/pull/N`
- Keep entries concise, single line with references at the end

## Versioning

- Use root npm scripts to bump version across all packages:
  - `npm run version:patch` — bump patch version (e.g., 0.4.3 → 0.4.4)
  - `npm run version:minor` — bump minor version (e.g., 0.4.3 → 0.5.0)
  - `npm run version:major` — bump major version (e.g., 0.4.3 → 1.0.0)
- These scripts update version in root and all workspace packages simultaneously
- Version is injected at build time from package.json (no manual sync needed)

## Architecture

4-package monorepo with clean dependency layering:

```
productive-api     → (nothing)          # types, API client, formatters
productive-core    → productive-api     # executors with dependency injection
productive-cli     → productive-core    # CLI commands, renderers, config+cache
productive-mcp     → productive-core    # MCP server handlers, OAuth
                   → productive-api
```

- **productive-api**: `ProductiveApi` (explicit config injection), resource types, formatters, `ProductiveApiError`, `ApiCache` interface
- **productive-core**: pure executor functions `(options, context) → ExecutorResult<T>`, `ExecutorContext` with DI, `createResourceResolver()` factory, bridge functions (`fromCommandContext`, `fromHandlerContext`)
- **productive-cli**: CLI commands, human/table/CSV renderers, keychain config, SQLite cache. Formatters re-export from `productive-api`.
- **productive-mcp**: MCP tool handlers, OAuth, MCP-specific compact formatters. `resolve.ts` is a thin wrapper around core's resolver.

Key principle: **executors are pure functions with zero side effects** — all dependencies injected via `ExecutorContext`. Tests use `createTestExecutorContext()` with no `vi.mock` needed.

Resource resolution (email → person ID, project number → project ID) is handled by `createResourceResolver()` in core. Bridge functions create a resolver automatically — CLI/MCP handlers just call `fromCommandContext(ctx)` or `fromHandlerContext(ctx)`.

## Testing Rules

These rules are **mandatory** for all code in this monorepo:

1. **Each package must have its own test suite approaching 100% coverage.** Every source file must have corresponding tests. Coverage thresholds are enforced per package in `vite.config.ts`.

2. **Dependency injection everywhere.** Tests must use DI instead of `vi.mock()` wherever possible. The only acceptable uses of `vi.mock()` are for mocking Node.js built-in modules (e.g., `node:fs`, `node:os`) or third-party modules that don't support DI.
   - **productive-core**: Use `createTestExecutorContext()` — never mock modules.
   - **productive-cli**: Use `createTestContext()` with mock API/config/cache — test handler functions directly.
   - **productive-mcp**: Use `createTestHandlerContext()` — test handler functions directly.
   - **productive-api**: Use constructor injection (`new ProductiveApi({ config, fetch, cache })`) — mock the `fetch` function, never the module.

3. **File system operations must be mocked.** Never read/write real user files in tests. Use `memfs` (already a devDependency) or mock `node:fs` to avoid side effects. The `config-store.ts`, `keychain-store.ts`, and `sqlite-cache.ts` tests must all use in-memory or mocked file systems.

4. **Test file conventions:**
   - Colocated tests go in `__tests__/` directories next to the source file.
   - Test file names match source: `foo.ts` → `__tests__/foo.test.ts`.
   - CLI command tests are centralized in `src/commands/__tests__/` (one file per resource).

5. **No real API calls in tests.** All HTTP requests must be mocked via DI (injected `fetch`) or mock API objects.

Build order: `productive-api` → `productive-core` → `productive-cli` / `productive-mcp`

After changing `productive-core` source, rebuild before running CLI/MCP tests:

```bash
cd packages/productive-core && npx vite build
```

---

# AI Agents & Automation

Integration guide for AI agents, automation workflows, CI/CD pipelines, and programmatic tools.

For general usage, see [README.md](./README.md).

## Quick Start for AI Agents

```bash
# Option 1: Pass credentials directly via CLI args (recommended for one-off commands)
npx @studiometa/productive-cli projects list \
  --token "your-api-token" \
  --org-id "your-organization-id" \
  --format json

# Option 2: Use environment variables (recommended for scripts)
export PRODUCTIVE_API_TOKEN="your-api-token"
export PRODUCTIVE_ORG_ID="your-organization-id"
export PRODUCTIVE_USER_ID="your-user-id"

npx @studiometa/productive-cli projects list --format json

# Parse response and use data
project_id=$(echo "$response" | jq -r '.data[0].id')
```

## Key Features

### Structured JSON Output

All commands support `--format json` with predictable schemas:

```bash
productive projects list --format json
productive time list --format json
productive tasks list --format json
```

Response structure:

```json
{
  "data": [...],           // Array of resources
  "meta": {                // Metadata (pagination, etc.)
    "page": 1,
    "per_page": 100,
    "total": 358
  }
}
```

### Consistent Error Handling

Errors are returned as structured JSON:

```json
{
  "error": "ProductiveApiError",
  "message": "API request failed: 401 Unauthorized",
  "statusCode": 401
}
```

Exit codes:

- `0` - Success
- `1` - Error

### Non-Interactive Commands

All commands are non-interactive:

- No prompts or user input required
- All parameters via CLI flags or environment variables
- Deterministic output format
- Silent execution

### Flexible Authentication

Three authentication methods with priority order:

1. CLI arguments: `--token`, `--org-id`, `--user-id`
2. Environment variables: `PRODUCTIVE_API_TOKEN`, `PRODUCTIVE_ORG_ID`, `PRODUCTIVE_USER_ID`
3. Config file: `~/.config/productive-cli/config.json`

```bash
# CLI arguments (best for one-off commands, override everything)
productive projects list --token "token" --org-id "org-id"

# Environment variables (best for scripts and CI/CD)
export PRODUCTIVE_API_TOKEN="token"
export PRODUCTIVE_ORG_ID="org-id"
export PRODUCTIVE_USER_ID="user-id"
export PRODUCTIVE_BASE_URL="https://api.productive.io/api/v2"  # Optional

# Config file (best for local development)
productive config set apiToken "token"
productive config set organizationId "org-id"
```

## Custom API Requests

When existing commands don't cover your needs, use the `api` command to make custom authenticated requests to any Productive API endpoint:

```bash
# Simple GET request
productive api /projects

# GET with query parameters
productive api /projects --field 'filter[archived]=false'

# POST request with fields (auto-detected as POST)
productive api /time_entries \
  --field person_id=12345 \
  --field service_id=67890 \
  --field date=2024-01-15 \
  --field time=480 \
  --raw-field note="Development work"

# PATCH request
productive api /time_entries/123456 \
  --method PATCH \
  --field time=240

# DELETE request
productive api /time_entries/123456 --method DELETE

# Fetch all pages automatically
productive api /time_entries --paginate

# Read body from file
productive api /time_entries \
  --method POST \
  --input body.json
```

### Field Type Conversion

The `--field` flag performs automatic type conversion:

- `true`, `false`, `null` → JSON boolean/null
- Numbers → integers or floats
- `@filename` → reads value from file
- Other values → strings

Use `--raw-field` to always treat values as strings (no conversion).

### API Command Features

- **Automatic authentication**: Uses configured credentials
- **Smart method detection**: Defaults to GET, or POST when fields are provided
- **Pagination support**: Use `--paginate` to fetch all pages
- **Custom headers**: Add with `-H` or `--header`
- **File input**: Use `--input` to read request body from a file
- **Response headers**: Use `--include` to show headers in output

See full documentation: `productive api --help`

## Common AI Agent Workflows

### Workflow 1: Time Entry Automation

```bash
#!/bin/bash

# Credentials passed as arguments
TOKEN="your-api-token"
ORG_ID="your-org-id"
USER_ID="your-user-id"

# List today's tasks
tasks=$(productive tasks list --token "$TOKEN" --org-id "$ORG_ID" --format json)

# Get first active task
task_id=$(echo "$tasks" | jq -r '.data[0].id')
service_id=$(echo "$tasks" | jq -r '.data[0].relationships.service.data.id')

# Create time entry for 8 hours
result=$(productive time add \
  --token "$TOKEN" \
  --org-id "$ORG_ID" \
  --user-id "$USER_ID" \
  --service "$service_id" \
  --date $(date +%Y-%m-%d) \
  --time 480 \
  --note "Automated time entry from AI agent" \
  --format json)

# Check result
if [ $? -eq 0 ]; then
  entry_id=$(echo "$result" | jq -r '.id')
  echo "Created time entry: $entry_id"
else
  echo "Failed: $(echo "$result" | jq -r '.message')"
  exit 1
fi
```

### Workflow 2: Project Status Report

```bash
#!/bin/bash

# Get all active projects
projects=$(productive projects list --format json)

# For each project, get time entries
echo "$projects" | jq -r '.data[] | .id' | while read project_id; do
  time_entries=$(productive time list \
    --project "$project_id" \
    --from $(date -d "7 days ago" +%Y-%m-%d) \
    --to $(date +%Y-%m-%d) \
    --format json)

  # Calculate total hours
  total_minutes=$(echo "$time_entries" | jq '[.data[].time_minutes] | add')
  total_hours=$(echo "scale=2; $total_minutes / 60" | bc)

  # Get project name
  project_name=$(echo "$projects" | jq -r ".data[] | select(.id==\"$project_id\") | .name")

  echo "$project_name: ${total_hours}h this week"
done
```

### Workflow 3: Bulk Time Entry Creation

```bash
#!/bin/bash

# Read time entries from a file
cat time_entries.json | jq -c '.[]' | while read entry; do
  service_id=$(echo "$entry" | jq -r '.service_id')
  date=$(echo "$entry" | jq -r '.date')
  time=$(echo "$entry" | jq -r '.time')
  note=$(echo "$entry" | jq -r '.note')

  productive time add \
    --service "$service_id" \
    --date "$date" \
    --time "$time" \
    --note "$note" \
    --format json

  # Rate limiting
  sleep 0.5
done
```

## API Client Library

For more complex integrations, use the `@studiometa/productive-api` package:

```typescript
import { ProductiveApi, ProductiveApiError } from '@studiometa/productive-api';

// Initialize with explicit config (no side effects)
const api = new ProductiveApi({
  config: {
    apiToken: process.env.PRODUCTIVE_API_TOKEN!,
    organizationId: process.env.PRODUCTIVE_ORG_ID!,
  },
});

async function automateTimeTracking() {
  try {
    const projects = await api.getProjects({ page: 1, perPage: 100 });
    const projectId = projects.data[0].id;
    const services = await api.getServices({ filter: { project_id: projectId } });

    const timeEntry = await api.createTimeEntry({
      person_id: process.env.PRODUCTIVE_USER_ID!,
      service_id: services.data[0].id,
      date: new Date().toISOString().split('T')[0],
      time: 480,
      note: 'Automated entry',
    });

    console.log('Created time entry:', timeEntry.data.id);
  } catch (error) {
    if (error instanceof ProductiveApiError) {
      console.error('API Error:', error.message, error.statusCode);
    }
    throw error;
  }
}
```

## Response Schemas

### Projects List Response

```json
{
  "data": [
    {
      "id": "123456",
      "name": "Project Name",
      "project_number": "PRJ-001",
      "archived": false,
      "budget": 50000.0,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 100,
    "total": 358
  }
}
```

### Time Entries List Response

```json
{
  "data": [
    {
      "id": "131776640",
      "date": "2024-01-16",
      "time_minutes": 480,
      "time_hours": "8.00",
      "note": "Development work",
      "person_id": "500521",
      "service_id": "6028361",
      "project_id": "777332",
      "created_at": "2024-01-16T10:00:00Z",
      "updated_at": "2024-01-16T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total_pages": 8345,
    "total_count": 41725,
    "page_size": 100,
    "max_page_size": 200
  }
}
```

### Time Entry Creation Response

```json
{
  "status": "success",
  "id": "131776640",
  "date": "2024-01-16",
  "time_minutes": 480,
  "time_hours": "8.00",
  "note": "Development work"
}
```

### Error Response

```json
{
  "error": "ProductiveApiError",
  "message": "API request failed: 401 Unauthorized",
  "statusCode": 401,
  "response": "{\"errors\":[...]}"
}
```

## Pagination Handling

For large datasets, use pagination:

```bash
# Page 1
productive projects list --page 1 --size 100 --format json

# Page 2
productive projects list --page 2 --size 100 --format json

# Calculate total pages from meta.total_pages
```

Programmatic pagination:

```typescript
const api = new ProductiveApi({
  config: {
    apiToken: process.env.PRODUCTIVE_API_TOKEN!,
    organizationId: process.env.PRODUCTIVE_ORG_ID!,
  },
});
let page = 1;
let allProjects = [];

while (true) {
  const response = await api.getProjects({ page, perPage: 100 });
  allProjects.push(...response.data);

  if (page >= response.meta.total_pages) break;
  page++;
}

console.log(`Fetched ${allProjects.length} projects`);
```

## Rate Limiting

Best practices for API rate limits:

1. Add delays between requests
2. Request 100-200 items per page (maximum)
3. Cache results when possible
4. Implement exponential backoff for 429 errors

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ProductiveApiError && error.statusCode === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const projects = await withRetry(() => api.getProjects());
```

## Security

Security best practices:

1. Keep API tokens out of logs and outputs
2. Never hardcode credentials
3. Rotate tokens periodically
4. Use read-only tokens when possible
5. Encrypt tokens in persistent storage

```bash
# Good: Environment variables
export PRODUCTIVE_API_TOKEN="$(cat /secure/path/token.txt)"

# Bad: Hardcoded in scripts
PRODUCTIVE_API_TOKEN="abc123..."  # Don't do this!
```

## Debugging

Enable debug output:

```bash
# Verbose output
DEBUG=productive:* productive projects list
```

Check exit codes:

```bash
productive projects list
echo "Exit code: $?"  # 0 = success, 1 = error
```

Validate configuration:

```bash
productive config validate --format json
```

## Support

- [API Documentation](https://developer.productive.io/)
- [Report Issues](https://github.com/studiometa/productive-tools/issues)
- [Discussions](https://github.com/studiometa/productive-tools/discussions)

## License

MIT © [Studio Meta](https://www.studiometa.fr/)
