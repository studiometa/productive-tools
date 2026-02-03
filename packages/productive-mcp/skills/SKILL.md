---
name: productive-mcp
description: MCP server for Productive.io - use with Claude Desktop or MCP-compatible clients for time tracking, projects, and tasks
---

# Productive MCP Server

MCP (Model Context Protocol) server for Productive.io. Provides a single unified tool for all operations.

## The `productive` Tool

Single unified tool with this signature:

```
productive(resource, action, [parameters...])
```

### Resources & Actions

| Resource    | Actions                                   | Description             |
| ----------- | ----------------------------------------- | ----------------------- |
| `projects`  | `list`, `get`, `help`                     | Project management      |
| `time`      | `list`, `get`, `create`, `update`, `help` | Time tracking           |
| `tasks`     | `list`, `get`, `create`, `update`, `help` | Task management         |
| `services`  | `list`, `get`, `help`                     | Budget line items       |
| `people`    | `list`, `get`, `me`, `help`               | Team members            |
| `companies` | `list`, `get`, `create`, `update`, `help` | Client companies        |
| `comments`  | `list`, `get`, `create`, `update`, `help` | Comments on tasks/deals |
| `timers`    | `list`, `get`, `start`, `stop`, `help`    | Active timers           |
| `deals`     | `list`, `get`, `create`, `update`, `help` | Sales deals             |
| `bookings`  | `list`, `get`, `create`, `update`, `help` | Resource scheduling     |
| `reports`   | `get`, `help`                             | Generate reports        |

### Getting Help

Use `action: "help"` to get detailed documentation for any resource:

```json
{
  "resource": "time",
  "action": "help"
}
```

Returns filters, fields, includes, and examples for that resource.

## Common Parameters

| Parameter  | Type    | Description                                            |
| ---------- | ------- | ------------------------------------------------------ |
| `resource` | string  | **Required**. Resource type (see table above)          |
| `action`   | string  | **Required**. Action to perform                        |
| `id`       | string  | Resource ID (for `get`, `update`, `stop`)              |
| `filter`   | object  | Filter criteria for `list` actions                     |
| `page`     | number  | Page number (default: 1)                               |
| `per_page` | number  | Items per page (default: 20, max: 200)                 |
| `compact`  | boolean | Compact output (default: true for list, false for get) |
| `include`  | array   | Related resources to include                           |
| `query`    | string  | Text search on name/title fields                       |

## Examples by Resource

### Projects

```json
// List projects
{ "resource": "projects", "action": "list" }

// Search projects
{ "resource": "projects", "action": "list", "query": "website" }

// Get project details
{ "resource": "projects", "action": "get", "id": "12345" }

// Filter active projects
{ "resource": "projects", "action": "list", "filter": { "archived": "false" } }
```

### Time Entries

```json
// List my time entries for a date range
{
  "resource": "time",
  "action": "list",
  "filter": {
    "person_id": "me",
    "after": "2024-01-15",
    "before": "2024-01-21"
  }
}

// Create time entry (time in MINUTES)
{
  "resource": "time",
  "action": "create",
  "service_id": "12345",
  "date": "2024-01-16",
  "time": 480,
  "note": "Development work"
}

// Update time entry
{
  "resource": "time",
  "action": "update",
  "id": "67890",
  "time": 240,
  "note": "Updated note"
}
```

### Tasks

```json
// List open tasks for a project
{
  "resource": "tasks",
  "action": "list",
  "filter": { "project_id": "12345", "status": "open" }
}

// Get task with comments
{
  "resource": "tasks",
  "action": "get",
  "id": "67890",
  "include": ["comments", "assignee"]
}

// Search tasks
{ "resource": "tasks", "action": "list", "query": "bug fix" }

// Create task
{
  "resource": "tasks",
  "action": "create",
  "title": "New task",
  "project_id": "12345",
  "task_list_id": "111"
}
```

### People

```json
// Get current user
{ "resource": "people", "action": "me" }

// List people
{ "resource": "people", "action": "list" }

// Search by name
{ "resource": "people", "action": "list", "query": "john" }
```

### Services

```json
// List services for a project
{
  "resource": "services",
  "action": "list",
  "filter": { "project_id": "12345" }
}
```

### Comments

```json
// List comments on a task
{
  "resource": "comments",
  "action": "list",
  "filter": { "task_id": "12345" }
}

// Add comment
{
  "resource": "comments",
  "action": "create",
  "task_id": "12345",
  "body": "Looking good!"
}
```

### Timers

```json
// List active timers
{ "resource": "timers", "action": "list" }

// Start timer on a service
{ "resource": "timers", "action": "start", "service_id": "12345" }

// Stop timer
{ "resource": "timers", "action": "stop", "id": "67890" }
```

### Reports

```json
// Time report by person
{
  "resource": "reports",
  "action": "get",
  "report_type": "time_reports",
  "group": "person",
  "from": "2024-01-01",
  "to": "2024-01-31"
}

// Budget report for a project
{
  "resource": "reports",
  "action": "get",
  "report_type": "budget_reports",
  "filter": { "project_id": "12345" }
}
```

## Filters Reference

### Time Entries

- `person_id` - Filter by person (use "me" for current user)
- `project_id` - Filter by project
- `service_id` - Filter by service
- `after` - After date (YYYY-MM-DD)
- `before` - Before date (YYYY-MM-DD)

### Tasks

- `project_id` - Filter by project
- `assignee_id` - Filter by assigned person
- `status` - Filter by status: `open`, `closed`, `all`
- `task_list_id` - Filter by task list

### Projects

- `company_id` - Filter by company
- `archived` - Include archived: `true`, `false`

### Services

- `project_id` - Filter by project
- `deal_id` - Filter by deal

### Bookings

- `person_id` - Filter by person
- `service_id` - Filter by service
- `after` / `before` - Date range

## Include (Related Resources)

Fetch related data in a single request:

```json
{
  "resource": "tasks",
  "action": "get",
  "id": "12345",
  "include": ["project", "project.company", "assignee", "comments"]
}
```

Common includes:

- Tasks: `project`, `assignee`, `workflow_status`, `comments`, `subtasks`
- Time entries: `person`, `service`, `project`
- Deals: `company`, `deal_status`, `responsible`

## Compact Mode

- `compact: true` (default for `list`) - Returns minimal fields
- `compact: false` (default for `get`) - Returns full details

Force full details on list:

```json
{ "resource": "projects", "action": "list", "compact": false }
```

## Time Values

**Time is always in MINUTES:**

- 60 = 1 hour
- 480 = 8 hours (full day)
- 240 = 4 hours (half day)

## Configuration Tools (stdio mode only)

In local/stdio mode, additional configuration tools are available:

```json
// Configure credentials
productive_configure({
  "organizationId": "...",
  "apiToken": "...",
  "userId": "..."
})

// View current config (token masked)
productive_get_config()
```

---

## Best Practices for AI Agents

**For data handling best practices, confirmation workflows, and error handling patterns, see the CLI skill documentation:**

→ `@studiometa/productive-cli/skills/SKILL.md`

Key points:

1. **Never modify text content** - Use exact titles, descriptions, notes from API
2. **Never invent IDs** - Always fetch first to get valid IDs
3. **Always confirm before mutations** - Ask user before create/update/delete
4. **Time is in minutes** - 480 = 8 hours

### MCP-Specific Tips

1. **Use `action: "help"`** - Get resource documentation before using unfamiliar resources
2. **Use `compact: false`** for detailed single-item views
3. **Use `include`** to reduce round-trips when you need related data
4. **Use `query`** for text search instead of fetching all and filtering
5. **Check `people.me`** first to get the current user's ID for filters
