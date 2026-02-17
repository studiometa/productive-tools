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

| Resource    | Actions                                              | Description             |
| ----------- | ---------------------------------------------------- | ----------------------- |
| `projects`  | `list`, `get`, `resolve`, `help`                     | Project management      |
| `time`      | `list`, `get`, `create`, `update`, `resolve`, `help` | Time tracking           |
| `tasks`     | `list`, `get`, `create`, `update`, `resolve`, `help` | Task management         |
| `services`  | `list`, `get`, `resolve`, `help`                     | Budget line items       |
| `people`    | `list`, `get`, `me`, `resolve`, `help`               | Team members            |
| `companies` | `list`, `get`, `create`, `update`, `resolve`, `help` | Client companies        |
| `comments`  | `list`, `get`, `create`, `update`, `help`            | Comments on tasks/deals |
| `timers`    | `list`, `get`, `start`, `stop`, `help`               | Active timers           |
| `deals`     | `list`, `get`, `create`, `update`, `resolve`, `help` | Sales deals             |
| `bookings`  | `list`, `get`, `create`, `update`, `help`            | Resource scheduling     |
| `budgets`   | `list`, `get`, `help`                                | Budget tracking         |
| `reports`   | `get`, `help`                                        | Generate reports        |

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

| Parameter  | Type    | Description                                                                              |
| ---------- | ------- | ---------------------------------------------------------------------------------------- |
| `resource` | string  | **Required**. Resource type (see table above)                                            |
| `action`   | string  | **Required**. Action to perform                                                          |
| `id`       | string  | Resource ID (for `get`, `update`, `stop`)                                                |
| `filter`   | object  | Filter criteria for `list` actions                                                       |
| `page`     | number  | Page number (default: 1)                                                                 |
| `per_page` | number  | Items per page (default: 20, max: 200)                                                   |
| `compact`  | boolean | Compact output (default: true for list, false for get)                                   |
| `include`  | array   | Related resources to include                                                             |
| `query`    | string  | Text search (behavior varies by resource - may search related fields like project names) |
| `no_hints` | boolean | Disable contextual hints in responses (default: false)                                   |

## Smart ID Resolution

Use human-friendly identifiers instead of numeric IDs. The server automatically resolves:

- **Emails** → Person IDs: `user@example.com` → `500521`
- **Project numbers** → Project IDs: `PRJ-123` or `P-123` → `777332`
- **Deal numbers** → Deal IDs: `D-456` or `DEAL-456` → `888123`
- **Names** → IDs: Company names, service names (with project context)

### Auto-Resolution in Filters

Filters automatically resolve human-friendly values:

```json
// Email resolved to person ID
{
  "resource": "tasks",
  "action": "list",
  "filter": { "assignee_id": "user@example.com" }
}

// Project number resolved
{
  "resource": "time",
  "action": "list",
  "filter": { "project_id": "PRJ-123" }
}
```

Response includes `_resolved` metadata showing what was resolved:

```json
{
  "data": [...],
  "_resolved": {
    "assignee_id": {
      "input": "user@example.com",
      "id": "500521",
      "label": "John Doe"
    }
  }
}
```

### Auto-Resolution in Get Actions

Use human-friendly IDs directly in `get` actions:

```json
{ "resource": "projects", "action": "get", "id": "PRJ-123" }
{ "resource": "people", "action": "get", "id": "user@example.com" }
{ "resource": "deals", "action": "get", "id": "D-456" }
```

### Explicit Resolution with `resolve` Action

Look up resources by human-friendly identifiers:

```json
// Resolve email to person
{ "resource": "people", "action": "resolve", "query": "user@example.com" }

// Resolve project number
{ "resource": "projects", "action": "resolve", "query": "PRJ-123" }

// Resolve with type hint (when pattern is ambiguous)
{ "resource": "time", "action": "resolve", "query": "Development", "type": "service", "project_id": "777332" }
```

Response:

```json
{
  "matches": [
    {
      "id": "500521",
      "label": "John Doe",
      "type": "person",
      "exact": true
    }
  ],
  "query": "user@example.com",
  "detected_type": "person"
}
```

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

// Search tasks by title or project name
{ "resource": "tasks", "action": "list", "query": "bug fix" }
{ "resource": "tasks", "action": "list", "query": "crosscall" }  // Also matches project names

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

### Budgets

```json
// List all budgets
{ "resource": "budgets", "action": "list" }

// List budgets for a project
{ "resource": "budgets", "action": "list", "filter": { "project_id": "12345" } }

// Get budget details
{ "resource": "budgets", "action": "get", "id": "67890" }

// List billable budgets
{ "resource": "budgets", "action": "list", "filter": { "billable": "true" } }
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
- `task_id` - Filter by task
- `company_id` - Filter by company
- `deal_id` / `budget_id` - Filter by deal/budget
- `after` - After date (YYYY-MM-DD)
- `before` - Before date (YYYY-MM-DD)
- `status` - Approval status: `1`=approved, `2`=unapproved, `3`=rejected
- `billing_type_id` - Billing type: `1`=fixed, `2`=actuals, `3`=non_billable
- `invoicing_status` - Invoicing: `1`=not_invoiced, `2`=drafted, `3`=finalized

### Tasks

- `project_id` - Filter by project
- `company_id` - Filter by company
- `assignee_id` - Filter by assigned person
- `creator_id` - Filter by task creator
- `status` - Status: `1`=open, `2`=closed (or "open", "closed", "all")
- `task_list_id` - Filter by task list
- `board_id` - Filter by board
- `workflow_status_id` - Filter by workflow status (kanban column)
- `parent_task_id` - Filter by parent task (for subtasks)
- `overdue_status` - Overdue: `1`=not overdue, `2`=overdue
- `due_date_on` / `due_date_before` / `due_date_after` - Due date filters

### Projects

- `company_id` - Filter by company
- `project_type` - Type: `1`=internal, `2`=client
- `responsible_id` - Filter by project manager
- `person_id` - Filter by team member
- `status` - Status: `1`=active, `2`=archived

### Services

- `project_id` - Filter by project
- `deal_id` - Filter by deal
- `task_id` - Filter by task
- `person_id` - Filter by person (trackable by)
- `budget_status` - Status: `1`=open, `2`=delivered
- `billing_type` - Type: `1`=fixed, `2`=actuals, `3`=none
- `time_tracking_enabled` - Boolean

### People

- `status` - Status: `1`=active, `2`=deactivated
- `person_type` - Type: `1`=user, `2`=contact, `3`=placeholder
- `company_id` - Filter by company
- `project_id` - Filter by project
- `role_id` - Filter by role
- `team` - Filter by team name

### Deals

- `company_id` - Filter by company
- `project_id` - Filter by project
- `responsible_id` - Filter by responsible person
- `pipeline_id` - Filter by pipeline
- `stage_status_id` - Stage: `1`=open, `2`=won, `3`=lost
- `type` - Type: `1`=deal, `2`=budget
- `budget_status` - Budget status: `1`=open, `2`=closed

### Bookings

- `person_id` - Filter by person
- `service_id` - Filter by service
- `project_id` - Filter by project
- `company_id` - Filter by company
- `event_id` - Filter by event
- `after` / `before` - Date range
- `booking_type` - Type: `event` (absence) or `service` (budget)
- `draft` - Tentative status: `true`/`false`

### Budgets

- `project_id` - Filter by project
- `company_id` - Filter by company
- `deal_id` - Filter by deal
- `billable` - Filter by billable status: `true`/`false`
- `budget_type` - Filter by budget type

### Comments

- `task_id` - Filter by task
- `deal_id` - Filter by deal
- `project_id` - Filter by project
- `page_id` - Filter by page
- `discussion_id` - Filter by discussion

### Timers

- `person_id` - Filter by person
- `time_entry_id` - Filter by time entry

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

## Contextual Hints

When fetching a single resource with `action: "get"`, the response includes a `_hints` field with suggestions for related resources and common actions. This helps discover how to fetch additional context.

Example response for a task:

```json
{
  "id": "16097010",
  "title": "Fix login bug",
  "_hints": {
    "related_resources": [
      {
        "resource": "comments",
        "description": "Get comments on this task",
        "example": {
          "resource": "comments",
          "action": "list",
          "filter": { "task_id": "16097010" }
        }
      },
      {
        "resource": "time",
        "description": "Get time entries logged on this task",
        "example": {
          "resource": "time",
          "action": "list",
          "filter": { "task_id": "16097010" }
        }
      }
    ],
    "common_actions": [
      {
        "action": "Add a comment",
        "example": {
          "resource": "comments",
          "action": "create",
          "task_id": "16097010",
          "body": "<your comment>"
        }
      }
    ]
  }
}
```

To disable hints, use `no_hints: true`:

```json
{ "resource": "tasks", "action": "get", "id": "16097010", "no_hints": true }
```

## Getting Task Context (Comments, Attachments)

To get full context for a task, follow these steps:

### 1. Get the task details

```json
{ "resource": "tasks", "action": "get", "id": "16097010" }
```

The response includes `_hints` showing how to fetch related resources.

### 2. Get comments on the task

```json
{
  "resource": "comments",
  "action": "list",
  "filter": { "task_id": "16097010" }
}
```

### 3. Get attachments (via include)

```json
{
  "resource": "tasks",
  "action": "get",
  "id": "16097010",
  "include": ["attachments"]
}
```

### 4. Get time entries

```json
{
  "resource": "time",
  "action": "list",
  "filter": { "task_id": "16097010" }
}
```

### Common Mistakes to Avoid

❌ **Wrong:** Trying non-existent endpoints like `/activities`, `/notes`, `/task_comments`
✅ **Right:** Use `resource: "comments"` with `filter: { task_id: "..." }`

❌ **Wrong:** Using `include: ["comments"]` on tasks (not supported)
✅ **Right:** Fetch comments separately with `resource: "comments", action: "list"`

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
4. **Use `query`** for text search - behavior varies by resource but may include related fields (e.g., tasks query may match project names)
5. **Check `people.me`** first to get the current user's ID for filters
6. **Follow `_hints`** - When getting a resource, check the `_hints` field for suggestions on fetching related context
