---
name: productive-mcp
description: MCP server for Productive.io - use with Claude Desktop or MCP-compatible clients for time tracking, projects, and tasks
---

# Productive MCP Server

MCP (Model Context Protocol) server for Productive.io. Provides a single unified tool for all operations.

## Quick Start

Before your first interaction with any resource, call `action=help` with that resource to discover valid filters, required fields, includes, and examples.

## The `productive` Tool

Single unified tool with this signature:

```
productive(resource, action, [parameters...])
```

### Resources & Actions

| Resource        | Actions                                                                  | Description                                              |
| --------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- |
| `projects`      | `list`, `get`, `resolve`, `context`, `help`                              | Project management                                       |
| `time`          | `list`, `get`, `create`, `update`, `resolve`, `help`                     | Time tracking                                            |
| `tasks`         | `list`, `get`, `create`, `update`, `resolve`, `context`, `help`          | Task management                                          |
| `services`      | `list`, `get`, `resolve`, `help`                                         | Budget line items                                        |
| `people`        | `list`, `get`, `me`, `resolve`, `help`                                   | Team members                                             |
| `companies`     | `list`, `get`, `create`, `update`, `resolve`, `help`                     | Client companies                                         |
| `comments`      | `list`, `get`, `create`, `update`, `help`                                | Comments on tasks/deals                                  |
| `attachments`   | `list`, `get`, `delete`, `help`                                          | File attachments                                         |
| `timers`        | `list`, `get`, `start`, `stop`, `help`                                   | Active timers                                            |
| `deals`         | `list`, `get`, `create`, `update`, `resolve`, `context`, `help`          | Sales deals & budgets (use `filter[type]=2` for budgets) |
| `bookings`      | `list`, `get`, `create`, `update`, `help`                                | Resource scheduling                                      |
| `pages`         | `list`, `get`, `create`, `update`, `delete`, `help`                      | Wiki/docs pages                                          |
| `discussions`   | `list`, `get`, `create`, `update`, `delete`, `resolve`, `reopen`, `help` | Discussions on pages                                     |
| `activities`    | `list`, `help`                                                           | Activity feed (audit log of create/update/delete events) |
| `custom_fields` | `list`, `get`, `help`                                                    | Custom field definitions and option values               |
| `reports`       | `get`, `help`                                                            | Generate reports                                         |
| `workflows`     | `complete_task`, `log_day`, `weekly_standup`, `help`                     | Compound workflows chaining multiple operations          |

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
// List services for a deal (budget line items) — prefer this over project_id when you have a deal
{
  "resource": "services",
  "action": "list",
  "filter": { "deal_id": "12345" }
}

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

// Add hidden comment (hidden from client)
{
  "resource": "comments",
  "action": "create",
  "task_id": "12345",
  "body": "Internal note",
  "hidden": true
}

// Toggle comment visibility
{
  "resource": "comments",
  "action": "update",
  "id": "67890",
  "hidden": false
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

### Pages (Docs)

```json
// List pages for a project
{ "resource": "pages", "action": "list", "filter": { "project_id": "12345" } }

// Get page details
{ "resource": "pages", "action": "get", "id": "67890" }

// Create a page
{
  "resource": "pages",
  "action": "create",
  "title": "Getting Started",
  "project_id": "12345"
}

// Create a sub-page
{
  "resource": "pages",
  "action": "create",
  "title": "Installation",
  "project_id": "12345",
  "parent_page_id": "67890"
}

// Delete a page
{ "resource": "pages", "action": "delete", "id": "67890" }
```

### Discussions

```json
// List discussions on a page
{
  "resource": "discussions",
  "action": "list",
  "filter": { "page_id": "12345" }
}

// List active discussions
{ "resource": "discussions", "action": "list", "status": "active" }

// Create a discussion
{
  "resource": "discussions",
  "action": "create",
  "page_id": "12345",
  "body": "This section needs review"
}

// Resolve a discussion
{ "resource": "discussions", "action": "resolve", "id": "67890" }

// Reopen a resolved discussion
{ "resource": "discussions", "action": "reopen", "id": "67890" }
```

### Workflows

Compound workflows that chain multiple operations into a single tool call.

```json
// Complete a task (marks closed, posts comment, stops timers)
{
  "resource": "workflows",
  "action": "complete_task",
  "task_id": "12345",
  "comment": "All done! Tests passing.",
  "stop_timer": true
}

// Complete a task without stopping timers
{
  "resource": "workflows",
  "action": "complete_task",
  "task_id": "12345",
  "stop_timer": false
}

// Log a full day across multiple services (time in minutes)
{
  "resource": "workflows",
  "action": "log_day",
  "date": "2024-01-16",
  "entries": [
    { "project_id": "100", "service_id": "111", "duration_minutes": 240, "note": "Frontend development" },
    { "project_id": "100", "service_id": "222", "duration_minutes": 120, "note": "Code review" },
    { "project_id": "200", "service_id": "333", "duration_minutes": 60, "note": "Client meeting" }
  ]
}

// Get weekly standup (this week)
{ "resource": "workflows", "action": "weekly_standup" }

// Get standup for a specific week (provide the Monday date)
{
  "resource": "workflows",
  "action": "weekly_standup",
  "week_start": "2024-01-15"
}

// Get standup for a specific person
{
  "resource": "workflows",
  "action": "weekly_standup",
  "person_id": "12345"
}
```

#### complete_task returns

- `task` — Updated task info (id, title, closed status)
- `comment_posted` — Whether the comment was successfully posted
- `comment_id` — ID of the created comment (if posted)
- `timers_stopped` — Number of timers that were stopped
- `errors` — Array of sub-step errors (partial results still returned)

#### log_day returns

- `entries` — Per-entry results with `success`, `time_entry` (on success), or `error` (on failure)
- `succeeded` / `failed` — Counts of successful and failed entries
- `total_minutes_logged` — Sum of minutes for successful entries

#### weekly_standup returns

- `completed_tasks` — Tasks closed this week with project names
- `time_logged` — Total minutes and breakdown by project (sorted by most time first)
- `upcoming_deadlines` — Open tasks due in the next 7 days with `days_until_due`

## Filters Reference

> **Tip:** Use `action: "help"` on any resource to see the full, up-to-date list of filters, fields, and examples. Use `action: "schema"` for a compact machine-readable spec.
>
> ```json
> { "resource": "tasks", "action": "help" }
> { "resource": "tasks", "action": "schema" }
> ```

### Text Search with `query`

Many resources support a `query` filter for full-text search. You can pass it either as a top-level shorthand or via the `filter` object (passthrough pattern):

```json
// Shorthand (top-level)
{ "resource": "projects", "action": "list", "query": "website" }

// Filter passthrough (explicit)
{ "resource": "projects", "action": "list", "filter": { "query": "website" } }
```

Resources that support `query`: **projects**, **tasks**, **people**, **companies**, **deals**

### Time Entries

- `person_id` - Filter by person (use "me" for current user) (array)
- `project_id` - Filter by project (array)
- `service_id` - Filter by service (array)
- `task_id` - Filter by task (array)
- `company_id` - Filter by company (array)
- `deal_id` / `budget_id` - Filter by deal/budget (array)
- `after` / `before` - Date range (YYYY-MM-DD)
- `date` - Exact date (YYYY-MM-DD)
- `status` - Approval status: `1`=approved, `2`=unapproved, `3`=rejected
- `billing_type_id` - Billing type: `1`=fixed, `2`=actuals, `3`=non_billable
- `invoicing_status` - Invoicing: `1`=not_invoiced, `2`=drafted, `3`=finalized
- `invoiced` - Invoiced status (boolean)
- `creator_id` / `approver_id` - Filter by creator or approver (array)
- `booking_id` - Filter by booking (array)
- `autotracked` - Auto-tracked entries (boolean)

### Tasks

- `query` - Text search on task title
- `project_id` - Filter by project (array)
- `company_id` - Filter by company (array)
- `assignee_id` - Filter by assigned person (array)
- `creator_id` - Filter by task creator (array)
- `status` - Status: `1`=open, `2`=closed (or "open", "closed", "all")
- `task_list_id` - Filter by task list (array)
- `task_list_status` - Task list status: `1`=open, `2`=closed
- `board_id` - Filter by board (array)
- `workflow_status_id` - Filter by workflow status/kanban column (array)
- `workflow_status_category_id` - Workflow category: `1`=not started, `2`=started, `3`=closed
- `workflow_id` - Filter by workflow (array)
- `parent_task_id` - Filter by parent task (for subtasks) (array)
- `task_type` - Task type: `1`=parent task, `2`=subtask
- `overdue_status` - Overdue: `1`=not overdue, `2`=overdue
- `due_date_on` / `due_date_before` / `due_date_after` - Due date filters
- `start_date_before` / `start_date_after` - Start date filters
- `after` / `before` - Created date range
- `closed_after` / `closed_before` - Closed date range
- `project_manager_id` - Filter by project manager (array)
- `subscriber_id` - Filter by subscriber/watcher (array)
- `tags` - Filter by tags

### Projects

- `query` - Text search on project name
- `company_id` - Filter by company (array)
- `project_type` - Type: `1`=internal, `2`=client
- `responsible_id` - Filter by project manager (array)
- `person_id` - Filter by team member (array)
- `status` - Status: `1`=active, `2`=archived

### Services

- `project_id` - Filter by project (array)
- `deal_id` - Filter by deal (array)
- `task_id` - Filter by task (array)
- `person_id` - Filter by person/trackable by (array)
- `name` - Filter by service name (text match)
- `budget_status` - Status: `1`=open, `2`=delivered
- `stage_status_id` - Stage: `1`=open, `2`=won, `3`=lost, `4`=delivered (array)
- `billing_type` - Type: `1`=fixed, `2`=actuals, `3`=none
- `unit` - Unit: `1`=hour, `2`=piece, `3`=day
- `time_tracking_enabled` / `expense_tracking_enabled` - Boolean
- `trackable_by_person_id` - Services trackable by a specific person
- `after` / `before` - Date range

### People

- `query` - Text search on name or email
- `email` - Filter by exact email address
- `status` - Status: `1`=active, `2`=deactivated
- `person_type` - Type: `1`=user, `2`=contact, `3`=placeholder
- `company_id` - Filter by company (array)
- `project_id` - Filter by project
- `role_id` - Filter by role (array)
- `team` - Filter by team name
- `manager_id` - Filter by manager
- `custom_role_id` - Filter by custom role
- `tags` - Filter by tags

### Companies

- `query` - Text search on company name
- `name` - Exact name match
- `company_code` / `billing_name` / `vat` - Filter by specific fields
- `status` - Status (integer)
- `archived` - Archived status (boolean)
- `project_id` - Filter by project (array)
- `subsidiary_id` - Filter by subsidiary (array)
- `default_currency` - Filter by currency code (e.g. USD, EUR)

### Deals

- `query` - Text search on deal name
- `number` - Filter by deal number
- `company_id` - Filter by company (array)
- `project_id` - Filter by project (array)
- `responsible_id` - Filter by responsible person (array)
- `creator_id` - Filter by creator (array)
- `pipeline_id` - Filter by pipeline (array)
- `stage_status_id` - Stage: `1`=open, `2`=won, `3`=lost (array)
- `status_id` - Filter by deal status (array)
- `type` - Type: `1`=deal, `2`=budget
- `deal_type_id` - Deal type: `1`=internal, `2`=client
- `budget_status` - Budget status: `1`=open, `2`=closed
- `project_type` - Project type: `1`=internal, `2`=client
- `subsidiary_id` - Filter by subsidiary (array)
- `tags` - Filter by tags
- `recurring` - Recurring deals (boolean)
- `needs_invoicing` / `time_approval` - Boolean filters

> **Note:** Budgets are deals with `budget=true`. There is no separate `/budgets` endpoint. Use `filter[type]=2` to list only budgets.

### Bookings

- `person_id` - Filter by person (array)
- `service_id` - Filter by service
- `project_id` - Filter by project (array)
- `company_id` - Filter by company (array)
- `event_id` - Filter by event/absence (array)
- `task_id` - Filter by task (array)
- `approver_id` - Filter by approver (array)
- `after` / `before` - Date range (YYYY-MM-DD)
- `started_on` / `ended_on` - Exact start/end date
- `booking_type` - Type: `event` (absence) or `service` (budget)
- `draft` - Tentative bookings only: `true`/`false`
- `with_draft` - Include tentative bookings: `true`/`false`
- `status` / `approval_status` - Approval status (array)
- `billing_type_id` - Billing type: `1`=fixed, `2`=actuals, `3`=none (array)
- `person_type` - Person type: `1`=user, `2`=contact, `3`=placeholder
- `canceled` - Canceled bookings (boolean)

### Pages

- `project_id` - Filter by project (array)
- `creator_id` - Filter by creator
- `parent_page_id` - Filter by parent page (for sub-pages)
- `edited_at` - Filter by last edited date (ISO 8601)

### Discussions

- `page_id` - Filter by page
- `status` - Status: `1`=active, `2`=resolved (or "active", "resolved")

### Comments

- `task_id` - Filter by task
- `project_id` - Filter by project (array)
- `page_id` - Filter by page (array)
- `discussion_id` - Filter by discussion
- `draft` - Draft comments: `true`/`false`
- `workflow_status_category_id` - Filter by workflow status category (array)

### Activities

- `event` - Event type: create, copy, update, delete, etc.
- `type` - Activity type: `1`=Comment, `2`=Changeset, `3`=Email
- `after` / `before` - ISO 8601 timestamp range
- `person_id` - Filter by person (array)
- `project_id` - Filter by project (array)
- `company_id` / `task_id` / `deal_id` / `discussion_id` - Filter by resource (array)
- `item_type` - Resource type (e.g. Task, Page, Deal, Workspace)
- `parent_type` / `root_type` - Parent/root resource type
- `has_attachments` / `pinned` - Boolean filters

### Custom Fields

- `customizable_type` - Resource type: Task, Deal, Company, Project, Booking, Service, etc.
- `archived` - Archived status: `true`/`false`
- `name` - Filter by field name
- `project_id` - Filter by project
- `global` - Global custom fields: `true`/`false`

**Workflow to resolve custom field values:**

1. Fetch a task/deal with `custom_fields` attribute (raw `{field_id: value}` hash)
2. List definitions: `resource=custom_fields, action=list, filter={customizable_type: "Task"}`
3. For select/multi-select: get field with options: `resource=custom_fields, action=get, id=<field_id>, include=["options"]`
4. Map field IDs to names, option IDs to values

**Data types:** 1=Text, 2=Number, 3=Select, 4=Date, 5=Multi-select, 6=Person, 7=Attachment

### Timers

- `person_id` - Filter by person
- `time_entry_id` - Filter by time entry
- `started_at` / `stopped_at` - Filter by start/stop time (ISO 8601)

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

## Proactive Suggestions

Certain responses include a `_suggestions` field with data-aware warnings and recommendations. Unlike `_hints` (which point to related resources), `_suggestions` draw attention to things that need action based on the data returned.

| Resource    | Action   | Suggestions generated                                |
| ----------- | -------- | ---------------------------------------------------- |
| `tasks`     | `list`   | ⚠️ overdue tasks count, ℹ️ unassigned tasks count    |
| `tasks`     | `get`    | ⚠️ task is N days overdue, ℹ️ no time entries        |
| `time`      | `list`   | 📊 total hours logged (or X/8h if filtered by today) |
| `summaries` | `my_day` | ⚠️ no time logged today, ⏱️ timer running too long   |

Example:

```json
{
  "data": [{ "id": "1", "title": "Fix bug", "due_date": "2024-01-01" }],
  "_suggestions": ["⚠️ 1 task(s) are overdue", "ℹ️ 1 task(s) have no assignee"]
}
```

Suggestions are suppressed when `no_hints: true` is set.

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

## Rich Context (Single Call)

Use `action=context` to fetch a resource along with all its related data in a single call. This replaces the multi-step approach described above.

**Available for:** `tasks`, `projects`, `deals`

### Tasks

```json
{ "resource": "tasks", "action": "context", "id": "16097010" }
```

Returns: task details + comments + time entries + subtasks

### Projects

```json
{ "resource": "projects", "action": "context", "id": "12345" }
```

Returns: project details + open tasks + services + recent time entries

### Deals

```json
{ "resource": "deals", "action": "context", "id": "12345" }
```

Returns: deal details + services + comments + time entries

> **Note:** Related data is limited to 20 items per type. For full listings, use separate `list` calls with appropriate filters.

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
7. **Act on `_suggestions`** - When present, `_suggestions` highlight data issues (overdue tasks, no time logged, etc.) that may need attention or should be surfaced to the user

## Prompt Templates

The server provides prompt templates (MCP prompts) that serve as guided conversation starters. Each prompt instructs the LLM which `productive` tool calls to make and how to format the output.

| Prompt           | Arguments                              | Description                           |
| ---------------- | -------------------------------------- | ------------------------------------- |
| `end-of-day`     | `format?` (slack/email/plain)          | Compose an end-of-day standup message |
| `project-review` | `project` (required)                   | Analyze project health and status     |
| `plan-sprint`    | `project` (required)                   | Prioritize tasks for next sprint      |
| `weekly-report`  | `person?`, `format?`                   | Generate a weekly progress report     |
| `invoice-prep`   | `project`, `from`, `to` (all required) | Prepare billing summary for a project |

### Examples

**End of day standup (Slack format)**:
Use the `end-of-day` prompt with `format=slack`. The LLM will call `summaries.my_day` and compose a Slack-formatted standup with what you did, what's next, and any blockers.

**Project health review**:
Use the `project-review` prompt with `project=PRJ-123`. The LLM will call `projects.context` and `tasks.list` to produce a RAG-status health report with budget burn, open tasks, and recommendations.

**Sprint planning**:
Use the `plan-sprint` prompt with `project=PRJ-123`. The LLM will fetch open tasks and budget services, then suggest a prioritized sprint scope with risk flags.

**Weekly report (email format)**:
Use the `weekly-report` prompt with optional `person=user@example.com` and `format=email`. The LLM will call `workflows.weekly_standup` and format a polished report grouped by project.

**Invoice preparation**:
Use the `invoice-prep` prompt with `project=PRJ-123`, `from=2025-01-01`, `to=2025-01-31`. The LLM will fetch time entries, services, and deals for the period and produce invoice-ready line items.
