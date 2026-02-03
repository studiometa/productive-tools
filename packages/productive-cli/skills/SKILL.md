---
name: productive-cli
description: CLI tool for Productive.io - time tracking, projects, tasks, and more. Use for AI agents and automation.
---

# Productive CLI

CLI tool for interacting with the Productive.io API. Optimized for AI agents with structured JSON output.

## Installation

```bash
# Global install
npm install -g @studiometa/productive-cli

# Or run directly with npx (no install needed)
npx @studiometa/productive-cli --help
npx @studiometa/productive-cli projects list
```

## Authentication

Three methods (in priority order):

1. **CLI arguments** (highest priority):

   ```bash
   productive projects list --token "TOKEN" --org-id "ORG_ID"
   ```

2. **Environment variables**:

   ```bash
   export PRODUCTIVE_API_TOKEN="your-token"
   export PRODUCTIVE_ORG_ID="your-org-id"
   export PRODUCTIVE_USER_ID="your-user-id"
   ```

3. **Config file** (persistent):
   ```bash
   productive config set apiToken YOUR_TOKEN
   productive config set organizationId YOUR_ORG_ID
   productive config set userId YOUR_USER_ID
   ```

## Output Formats

```bash
--format json    # Structured JSON (recommended for agents)
--format human   # Human-readable (default)
--format csv     # CSV export
--format table   # ASCII table
```

Always use `--format json` for parsing and automation.

## Commands

### Projects

```bash
productive projects list              # List all projects
productive p ls                       # Alias
productive projects get <id>          # Get project details
productive projects list --format json
```

### Time Entries

```bash
# List
productive time list                  # All entries
productive t ls                       # Alias
productive time list --date today
productive time list --date yesterday
productive time list --from 2024-01-01 --to 2024-01-31
productive time list --mine           # Current user only
productive time list --project <id>

# Create (time in MINUTES)
productive time add \
  --service <service_id> \
  --time 480 \
  --date 2024-01-15 \
  --note "Description"

# Update
productive time update <id> --time 240
productive time update <id> --note "Updated note"

# Delete
productive time delete <id>
productive time rm <id>               # Alias
```

### Tasks

```bash
productive tasks list
productive tasks list --project <id>
productive tasks list --mine          # Assigned to current user
productive tasks list --status open   # open, completed, all
productive tasks get <id>
```

### People

```bash
productive people list
productive people get <id>
```

### Services (Budget Line Items)

```bash
productive services list
productive svc ls                     # Alias
productive services list --filter deal_id=<id>
```

### Budgets (Deals)

```bash
productive budgets list
productive budgets get <id>
```

### Companies

```bash
productive companies list
productive companies get <id>
```

### Comments

```bash
productive comments list --filter task_id=<id>
productive comments get <id>
```

### Timers

```bash
productive timers list
productive timers start --service <id>
productive timers stop <id>
```

### Bookings

```bash
productive bookings list
productive bookings list --filter person_id=<id>
```

### Reports

```bash
productive reports time --from 2024-01-01 --to 2024-01-31 --group person
productive reports budget --project <id>
```

### Custom API Requests

For endpoints not covered by built-in commands:

```bash
# GET request
productive api /companies

# GET with filters
productive api /tasks --field 'filter[project_id]=12345'

# POST (auto-detected when fields provided)
productive api /comments \
  --field task_id=12345 \
  --raw-field body="Comment text"

# PATCH
productive api /tasks/12345 \
  --method PATCH \
  --raw-field title="Updated title"

# DELETE
productive api /time_entries/12345 --method DELETE

# Fetch all pages
productive api /time_entries --paginate
```

### Cache

```bash
productive cache status
productive cache clear
productive cache clear projects       # Clear specific pattern

# Bypass cache
productive projects list --no-cache
productive projects list --refresh    # Force refresh
```

## Common Options

| Option           | Alias | Description                            |
| ---------------- | ----- | -------------------------------------- |
| `--format <fmt>` | `-f`  | Output format: json, human, csv, table |
| `--page <num>`   | `-p`  | Page number                            |
| `--size <num>`   | `-s`  | Items per page (default: 100)          |
| `--sort <field>` |       | Sort field (prefix `-` for descending) |
| `--mine`         |       | Filter by current user                 |
| `--no-cache`     |       | Bypass cache                           |
| `--refresh`      |       | Force cache refresh                    |

## Date Formats

The CLI accepts flexible date inputs:

- **ISO format**: `2024-01-15`
- **Keywords**: `today`, `yesterday`, `tomorrow`
- **Ranges**: `"this week"`, `"last week"`, `"this month"`, `"last month"`
- **Relative**: `"2 days ago"`, `"1 week ago"`, `"3 months ago"`

## Time Values

**Time is always in MINUTES:**

- 60 = 1 hour
- 480 = 8 hours (full day)
- 240 = 4 hours (half day)
- 30 = 30 minutes

## JSON Response Structure

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "per_page": 100,
    "total": 358
  }
}
```

## Error Response

```json
{
  "error": "ProductiveApiError",
  "message": "API request failed: 401 Unauthorized",
  "statusCode": 401
}
```

Exit codes: `0` = success, `1` = error

---

## Best Practices for AI Agents

### Data Integrity

1. **Never modify text content** - Use exact titles, descriptions, and notes from the API. Do not rephrase, summarize, or "improve" user content.

2. **Never invent IDs** - Always fetch resources first to get valid IDs. Don't guess or make up project_id, service_id, person_id, etc.

3. **Preserve formatting** - Task descriptions and comments may contain HTML or Markdown. Preserve it as-is.

### Confirmation Before Mutations

**Always ask for user confirmation before:**

- Creating time entries
- Updating tasks or time entries
- Deleting any resource
- Posting comments

**Example confirmation prompt:**

```
I'll create the following time entry:
- Service: #12345 "Development"
- Duration: 2h (120 minutes)
- Date: 2024-01-15
- Note: "Feature implementation"

Confirm? (yes/no)
```

### Fetching Strategy

1. **Fetch before referencing** - Get the list of services/projects before creating time entries
2. **Use filters** - Don't fetch all data, filter by project_id, date range, etc.
3. **Paginate large results** - Use --page and --size for large datasets
4. **Cache awareness** - Use --refresh when you need fresh data

### Error Handling

1. Check exit code (`$?`) after commands
2. Parse error JSON for details when using `--format json`
3. Handle 401 (auth), 404 (not found), 422 (validation) appropriately

### Common Workflows

**Log time for today:**

```bash
# 1. Get services for the project
productive services list --filter project_id=12345 --format json

# 2. User confirms service and duration
# 3. Create entry
productive time add --service <id> --time 480 --note "Work done"
```

**Review time entries:**

```bash
# Get this week's entries
productive time list --date "this week" --mine --format json
```

**Find a task:**

```bash
# Search in a project
productive tasks list --project <id> --status open --format json
```
