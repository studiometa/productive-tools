/**
 * Help handler - provides detailed documentation for each resource
 */

import type { ToolResult } from './types.js';

import { jsonResult } from './utils.js';

interface ResourceHelp {
  description: string;
  actions: Record<string, string>;
  filters?: Record<string, string>;
  includes?: string[];
  fields?: Record<string, string>;
  examples?: Array<{ description: string; params: Record<string, unknown> }>;
}

const RESOURCE_HELP: Record<string, ResourceHelp> = {
  batch: {
    description:
      'Execute multiple operations in a single call. Operations run in parallel via Promise.all, reducing round-trips for AI agents.',
    actions: {
      run: 'Execute a batch of operations (max 10)',
    },
    fields: {
      operations:
        'Array of operation objects. Each must have "resource" and "action", plus any additional params for that resource.',
    },
    examples: [
      {
        description: 'Batch multiple queries',
        params: {
          resource: 'batch',
          action: 'run',
          operations: [
            { resource: 'projects', action: 'get', id: '123' },
            { resource: 'time', action: 'list', filter: { project_id: '123' } },
            { resource: 'services', action: 'list', filter: { project_id: '123' } },
          ],
        },
      },
      {
        description: 'Batch create time entries',
        params: {
          resource: 'batch',
          action: 'run',
          operations: [
            {
              resource: 'time',
              action: 'create',
              service_id: '111',
              date: '2024-01-15',
              time: 60,
              note: 'Morning work',
            },
            {
              resource: 'time',
              action: 'create',
              service_id: '111',
              date: '2024-01-15',
              time: 120,
              note: 'Afternoon work',
            },
          ],
        },
      },
    ],
  },

  projects: {
    description: 'Manage projects in Productive.io',
    actions: {
      list: 'List all projects with optional filters',
      get: 'Get a single project by ID (supports PRJ-123, P-123 format)',
      resolve: 'Resolve by project number (PRJ-123, P-123)',
      context:
        'Get full project context in one call: project details + open tasks + services + recent time entries',
    },
    filters: {
      query: 'Text search on project name',
      project_type: 'Filter by project type: 1=internal, 2=client',
      company_id: 'Filter by company',
      responsible_id: 'Filter by project manager',
      person_id: 'Filter by team member',
      status: 'Filter by status: 1=active, 2=archived',
    },
    fields: {
      id: 'Unique project identifier',
      name: 'Project name',
      project_number: 'Project reference number',
      archived: 'Whether the project is archived',
      budget: 'Project budget amount',
    },
    examples: [
      {
        description: 'Search projects by name',
        params: { resource: 'projects', action: 'list', query: 'website' },
      },
      {
        description: 'Search projects by name (filter passthrough)',
        params: { resource: 'projects', action: 'list', filter: { query: 'website' } },
      },
      {
        description: 'List active client projects',
        params: {
          resource: 'projects',
          action: 'list',
          filter: { status: '1', project_type: '2' },
        },
      },
      {
        description: 'List active projects',
        params: { resource: 'projects', action: 'list', filter: { archived: 'false' } },
      },
      {
        description: 'Get project details',
        params: { resource: 'projects', action: 'get', id: '12345' },
      },
      {
        description: 'Get full project context',
        params: { resource: 'projects', action: 'context', id: '12345' },
      },
    ],
  },

  tasks: {
    description: 'Manage tasks within projects',
    actions: {
      list: 'List tasks with optional filters',
      get: 'Get a single task by ID with full details (description, comments, etc.)',
      create: 'Create a new task (requires title, project_id, task_list_id)',
      update: 'Update an existing task',
      resolve: 'Resolve by text search',
      context:
        'Get full task context in one call: task details + comments + time entries + subtasks',
    },
    filters: {
      query: 'Text search on task title',
      project_id: 'Filter by project (array)',
      company_id: 'Filter by company (array)',
      assignee_id: 'Filter by assigned person (array)',
      creator_id: 'Filter by task creator (array)',
      status: 'Filter by status: 1=open, 2=closed (or "open", "closed", "all")',
      task_list_id: 'Filter by task list (array)',
      task_list_status: 'Filter by task list status: 1=open, 2=closed',
      task_list_name: 'Filter by task list name (text match)',
      board_id: 'Filter by board (array)',
      board_name: 'Filter by board name (text match)',
      board_status: 'Filter by board status: 1=active, 2=archived',
      workflow_status_id: 'Filter by workflow status/kanban column (array)',
      workflow_status_category_id:
        'Filter by workflow status category: 1=not started, 2=started, 3=closed',
      workflow_id: 'Filter by workflow (array)',
      parent_task_id: 'Filter by parent task (for subtasks) (array)',
      task_type: 'Filter by task type: 1=parent task, 2=subtask',
      task_number: 'Filter by task number within project',
      overdue_status: 'Filter by overdue: 1=not overdue, 2=overdue',
      due_date: 'Filter by due date: 1=any, 2=overdue',
      due_date_on: 'Filter by exact due date (YYYY-MM-DD)',
      due_date_before: 'Filter by due date before (YYYY-MM-DD)',
      due_date_after: 'Filter by due date after (YYYY-MM-DD)',
      start_date: 'Filter by exact start date (YYYY-MM-DD)',
      start_date_before: 'Filter by start date before (YYYY-MM-DD)',
      start_date_after: 'Filter by start date after (YYYY-MM-DD)',
      after: 'Filter tasks created after date (YYYY-MM-DD)',
      before: 'Filter tasks created before date (YYYY-MM-DD)',
      closed_after: 'Filter tasks closed after date (YYYY-MM-DD)',
      closed_before: 'Filter tasks closed before date (YYYY-MM-DD)',
      project_manager_id: 'Filter by project manager (array)',
      project_type: 'Filter by project type: 1=internal project, 2=client project',
      subscriber_id: 'Filter by subscriber/watcher (array)',
      last_actor_id: 'Filter by last person who acted on the task (array)',
      tags: 'Filter by tags',
      repeating: 'Filter repeating tasks (boolean)',
    },
    includes: [
      'project',
      'project.company',
      'assignee',
      'workflow_status',
      'comments',
      'attachments',
      'subtasks',
    ],
    fields: {
      id: 'Unique task identifier',
      title: 'Task title',
      description: 'Full task description (HTML)',
      number: 'Task number within project',
      due_date: 'Due date (YYYY-MM-DD)',
      initial_estimate: 'Estimated time in minutes',
      worked_time: 'Logged time in minutes',
      remaining_time: 'Remaining time in minutes',
      closed: 'Whether the task is closed',
    },
    examples: [
      {
        description: 'Search tasks by title',
        params: { resource: 'tasks', action: 'list', query: 'bug fix' },
      },
      {
        description: 'Search tasks by title (filter passthrough)',
        params: { resource: 'tasks', action: 'list', filter: { query: 'bug fix' } },
      },
      {
        description: 'List open tasks for a project',
        params: {
          resource: 'tasks',
          action: 'list',
          filter: { project_id: '12345', status: 'open' },
        },
      },
      {
        description: 'List overdue tasks for a project',
        params: {
          resource: 'tasks',
          action: 'list',
          filter: { project_id: '12345', overdue_status: '2' },
        },
      },
      {
        description: 'List subtasks of a parent task',
        params: {
          resource: 'tasks',
          action: 'list',
          filter: { parent_task_id: '12345' },
        },
      },
      {
        description: 'Get task with comments',
        params: {
          resource: 'tasks',
          action: 'get',
          id: '67890',
          include: ['comments', 'assignee'],
        },
      },
      {
        description: 'Create a task',
        params: {
          resource: 'tasks',
          action: 'create',
          title: 'New task',
          project_id: '12345',
          task_list_id: '111',
        },
      },
      {
        description: 'Get full task context',
        params: { resource: 'tasks', action: 'context', id: '67890' },
      },
    ],
  },

  time: {
    description: 'Track time entries against services/tasks',
    actions: {
      list: 'List time entries with optional filters',
      get: 'Get a single time entry by ID',
      create: 'Create a new time entry (requires person_id, service_id, date, time)',
      update: 'Update an existing time entry',
      delete: 'Delete a time entry',
      resolve: 'Resolve related resources (person, project, service)',
    },
    filters: {
      person_id: 'Filter by person (use "me" for current user) (array)',
      service_id: 'Filter by service (array)',
      project_id: 'Filter by project (array)',
      task_id: 'Filter by task (array)',
      company_id: 'Filter by company (array)',
      deal_id: 'Filter by deal (array)',
      budget_id: 'Filter by budget (array)',
      after: 'Filter entries after date (YYYY-MM-DD)',
      before: 'Filter entries before date (YYYY-MM-DD)',
      date: 'Filter by exact date (YYYY-MM-DD)',
      status:
        'Filter by approval status: 1=approved, 2=unapproved, 3=rejected (5=submitted, 6=draft if timesheet feature enabled)',
      billing_type_id: 'Filter by billing type: 1=fixed, 2=actuals, 3=non_billable',
      invoicing_status: 'Filter by invoicing: 1=not_invoiced, 2=drafted, 3=finalized',
      invoiced: 'Filter by invoiced status (boolean)',
      creator_id: 'Filter by creator (array)',
      approver_id: 'Filter by approver (array)',
      responsible_id: 'Filter by responsible person (array)',
      booking_id: 'Filter by booking (array)',
      invoice_id: 'Filter by invoice (array)',
      autotracked: 'Filter auto-tracked entries (boolean)',
    },
    fields: {
      id: 'Unique time entry identifier',
      date: 'Date of the entry (YYYY-MM-DD)',
      time: 'Time in minutes',
      note: 'Description of work done',
      billable_time: 'Billable time in minutes',
      approved: 'Whether the entry is approved',
      overhead: 'Whether the entry is overhead time',
      started_at: 'Start time for timer-based entries (ISO 8601)',
    },
    examples: [
      {
        description: 'List my time entries this week',
        params: {
          resource: 'time',
          action: 'list',
          filter: { person_id: 'me', after: '2024-01-15', before: '2024-01-21' },
        },
      },
      {
        description: 'Log 2 hours',
        params: {
          resource: 'time',
          action: 'create',
          service_id: '12345',
          date: '2024-01-16',
          time: 120,
          note: 'Development work',
        },
      },
    ],
  },

  services: {
    description: 'Budget line items within projects',
    actions: {
      list: 'List services with optional filters',
      get: 'Get a single service by ID',
    },
    filters: {
      project_id: 'Filter by project (array)',
      deal_id: 'Filter by deal (array)',
      task_id: 'Filter by task (array)',
      person_id: 'Filter by person (trackable by) (array)',
      name: 'Filter by service name (text match)',
      budget_status: 'Filter by budget status: 1=open, 2=delivered',
      stage_status_id: 'Filter by stage status: 1=open, 2=won, 3=lost, 4=delivered (array)',
      billing_type: 'Filter by billing type: 1=fixed, 2=actuals, 3=none',
      unit: 'Filter by unit: 1=hour, 2=piece, 3=day',
      time_tracking_enabled: 'Filter by time tracking enabled: true/false',
      expense_tracking_enabled: 'Filter by expense tracking enabled: true/false',
      trackable_by_person_id: 'Filter services trackable by a specific person',
      after: 'Filter by service date after (YYYY-MM-DD)',
      before: 'Filter by service date before (YYYY-MM-DD)',
    },
    fields: {
      id: 'Unique service identifier',
      name: 'Service name',
      budgeted_time: 'Budgeted time in minutes',
      worked_time: 'Logged time in minutes',
      billing_type_id: 'Billing type: 1=fixed, 2=actuals, 3=non_billable',
    },
    examples: [
      {
        description: 'List services for a deal (budget line items)',
        params: { resource: 'services', action: 'list', filter: { deal_id: '12345' } },
      },
      {
        description: 'List services for a project',
        params: { resource: 'services', action: 'list', filter: { project_id: '12345' } },
      },
    ],
  },

  people: {
    description: 'Team members and contacts',
    actions: {
      list: 'List people with optional filters',
      get: 'Get a single person by ID (supports email address)',
      me: 'Get the currently authenticated user',
      resolve: 'Resolve by email address',
    },
    filters: {
      query: 'Text search on name or email',
      email: 'Filter by exact email address',
      status: 'Filter by status: 1=active, 2=deactivated',
      person_type: 'Filter by type: 1=user, 2=contact, 3=placeholder',
      company_id: 'Filter by company (array)',
      project_id: 'Filter by project',
      role_id: 'Filter by role (array)',
      team: 'Filter by team name',
      manager_id: 'Filter by manager',
      custom_role_id: 'Filter by custom role',
      tags: 'Filter by tags',
    },
    fields: {
      id: 'Unique person identifier',
      name: 'Full name',
      first_name: 'First name',
      last_name: 'Last name',
      email: 'Email address',
      title: 'Job title',
      active: 'Whether the person is active',
      custom_fields: 'Employee custom fields (when Employee Fields are enabled)',
    },
    examples: [
      { description: 'Get current user', params: { resource: 'people', action: 'me' } },
      {
        description: 'Search people by name',
        params: { resource: 'people', action: 'list', query: 'john' },
      },
      {
        description: 'List active team members',
        params: { resource: 'people', action: 'list', filter: { status: 'active' } },
      },
    ],
  },

  companies: {
    description: 'Client companies and organizations',
    actions: {
      list: 'List companies with optional filters',
      get: 'Get a single company by ID (supports company name)',
      create: 'Create a new company (requires name)',
      update: 'Update an existing company',
      resolve: 'Resolve by company name',
    },
    filters: {
      query: 'Text search on company name',
      name: 'Filter by exact company name',
      company_code: 'Filter by company code',
      billing_name: 'Filter by billing/legal name',
      vat: 'Filter by VAT number',
      status: 'Filter by status (integer)',
      archived: 'Filter by archived status (true/false)',
      project_id: 'Filter by project (array)',
      subsidiary_id: 'Filter by subsidiary (array)',
      default_currency: 'Filter by default currency code (e.g. USD, EUR)',
    },
    fields: {
      id: 'Unique company identifier',
      name: 'Company name',
      billing_name: 'Legal/billing name',
      domain: 'Website domain',
      vat: 'VAT number',
    },
    examples: [
      {
        description: 'Search companies',
        params: { resource: 'companies', action: 'list', query: 'acme' },
      },
      {
        description: 'List active companies',
        params: { resource: 'companies', action: 'list', filter: { archived: 'false' } },
      },
    ],
  },

  attachments: {
    description: 'File attachments on tasks, comments, and pages',
    actions: {
      list: 'List attachments with optional filters',
      get: 'Get a single attachment by ID',
      delete: 'Delete an attachment by ID',
    },
    filters: {
      task_id: 'Filter by task (array)',
      comment_id: 'Filter by comment (array)',
      page_id: 'Filter by page (array)',
    },
    fields: {
      id: 'Unique attachment identifier',
      name: 'File name',
      content_type: 'MIME type (e.g., image/png, application/pdf)',
      size: 'File size in bytes',
      size_human: 'Human-readable file size (e.g., 1.5 MB)',
      url: 'Download URL',
      attachable_type: 'Parent resource type (Task, Comment, Deal, Page)',
    },
    examples: [
      {
        description: 'List attachments on a task',
        params: { resource: 'attachments', action: 'list', filter: { task_id: '12345' } },
      },
      {
        description: 'Get attachment details',
        params: { resource: 'attachments', action: 'get', id: '67890' },
      },
      {
        description: 'Delete an attachment',
        params: { resource: 'attachments', action: 'delete', id: '67890' },
      },
    ],
  },

  comments: {
    description: 'Comments on tasks, deals, and other resources',
    actions: {
      list: 'List comments with optional filters',
      get: 'Get a single comment by ID',
      create: 'Create a new comment (requires body and one of: task_id, deal_id, company_id)',
      update: 'Update an existing comment',
    },
    filters: {
      task_id: 'Filter by task',
      project_id: 'Filter by project (array)',
      page_id: 'Filter by page (array)',
      discussion_id: 'Filter by discussion',
      draft: 'Filter draft comments: true/false',
      workflow_status_category_id: 'Filter by workflow status category (array)',
    },
    includes: ['creator', 'task', 'deal'],
    fields: {
      id: 'Unique comment identifier',
      body: 'Comment text (may contain HTML)',
      hidden: 'Boolean — true if hidden from client (default: false)',
      creator: 'Person who created the comment',
    },
    examples: [
      {
        description: 'List comments on a task',
        params: { resource: 'comments', action: 'list', filter: { task_id: '12345' } },
      },
      {
        description: 'Add a comment',
        params: { resource: 'comments', action: 'create', task_id: '12345', body: 'Looking good!' },
      },
      {
        description: 'Add a hidden comment (hidden from client)',
        params: {
          resource: 'comments',
          action: 'create',
          task_id: '12345',
          body: 'Internal note',
          hidden: true,
        },
      },
    ],
  },

  timers: {
    description: 'Active time tracking timers',
    actions: {
      list: 'List active timers',
      get: 'Get a single timer by ID',
      start: 'Start a new timer (requires service_id or time_entry_id)',
      stop: 'Stop an active timer by ID',
    },
    filters: {
      person_id: 'Filter by person',
      time_entry_id: 'Filter by time entry',
      started_at: 'Filter timers started after date (ISO 8601)',
      stopped_at: 'Filter timers stopped after date (ISO 8601)',
    },
    fields: {
      id: 'Unique timer identifier',
      started_at: 'When the timer started (ISO 8601)',
      total_time: 'Elapsed time in seconds',
    },
    examples: [
      { description: 'List active timers', params: { resource: 'timers', action: 'list' } },
      {
        description: 'Start timer on service',
        params: { resource: 'timers', action: 'start', service_id: '12345' },
      },
      { description: 'Stop timer', params: { resource: 'timers', action: 'stop', id: '67890' } },
    ],
  },

  deals: {
    description:
      'Sales deals, opportunities, and budgets. Budgets are deals with budget=true — use filter[type]=2 to list only budgets.',
    actions: {
      list: 'List deals with optional filters',
      get: 'Get a single deal by ID (supports D-123, DEAL-123 format)',
      create: 'Create a new deal (requires name, company_id)',
      update: 'Update an existing deal',
      resolve: 'Resolve by deal number (D-123, DEAL-123)',
      context:
        'Get full deal context in one call: deal details + services + comments + time entries',
    },
    filters: {
      query: 'Text search on deal name',
      number: 'Filter by deal number',
      company_id: 'Filter by company (array)',
      project_id: 'Filter by project (array)',
      responsible_id: 'Filter by responsible person (array)',
      creator_id: 'Filter by creator (array)',
      pipeline_id: 'Filter by pipeline (array)',
      stage_status_id: 'Filter by stage: 1=open, 2=won, 3=lost (array)',
      status_id: 'Filter by deal status (array)',
      type: 'Filter by type: 1=deal, 2=budget',
      deal_type_id: 'Filter by deal type: 1=internal, 2=client',
      budget_status: 'Filter by budget status: 1=open, 2=closed',
      project_type: 'Filter by project type: 1=internal project, 2=client project',
      subsidiary_id: 'Filter by subsidiary (array)',
      tags: 'Filter by tags',
      recurring: 'Filter recurring deals (boolean)',
      needs_invoicing: 'Filter deals that need invoicing (boolean)',
      time_approval: 'Filter by time approval enabled (boolean)',
    },
    includes: ['company', 'deal_status', 'responsible', 'project'],
    fields: {
      id: 'Unique deal identifier',
      name: 'Deal name',
      number: 'Deal number',
      date: 'Deal date',
      budget: 'Whether this deal is a budget (true/false)',
      status: 'Current status (from deal_status)',
    },
    examples: [
      {
        description: 'Search deals',
        params: { resource: 'deals', action: 'list', query: 'website redesign' },
      },
      {
        description: 'List deals for a company',
        params: { resource: 'deals', action: 'list', filter: { company_id: '12345' } },
      },
      {
        description: 'List only budgets',
        params: { resource: 'deals', action: 'list', filter: { type: '2' } },
      },
      {
        description: 'Get full deal context',
        params: { resource: 'deals', action: 'context', id: '12345' },
      },
    ],
  },

  bookings: {
    description: 'Resource scheduling and capacity planning',
    actions: {
      list: 'List bookings with optional filters',
      get: 'Get a single booking by ID',
      create:
        'Create a new booking (requires person_id, started_on, ended_on, and service_id or event_id)',
      update: 'Update an existing booking',
    },
    filters: {
      person_id: 'Filter by person (array)',
      service_id: 'Filter by service',
      project_id: 'Filter by project (array)',
      company_id: 'Filter by company (array)',
      event_id: 'Filter by event/absence (array)',
      task_id: 'Filter by task (array)',
      approver_id: 'Filter by approver (array)',
      after: 'Filter bookings after date (YYYY-MM-DD)',
      before: 'Filter bookings before date (YYYY-MM-DD)',
      started_on: 'Filter by exact start date (YYYY-MM-DD)',
      ended_on: 'Filter by exact end date (YYYY-MM-DD)',
      booking_type: 'Filter by type: event (absence) or service (budget)',
      draft: 'Filter tentative bookings only: true/false',
      with_draft: 'Include tentative bookings in results: true/false',
      status: 'Filter by approval status (alias for approval_status)',
      approval_status: 'Filter by approval status (array)',
      billing_type_id: 'Filter by billing type: 1=fixed, 2=actuals, 3=none (array)',
      person_type: 'Filter by person type: 1=user, 2=contact, 3=placeholder',
      project_type: 'Filter by project type (array)',
      tags: 'Filter by tags (array)',
      canceled: 'Filter canceled bookings (boolean)',
    },
    includes: ['person', 'service', 'event'],
    fields: {
      id: 'Unique booking identifier',
      started_on: 'Start date (YYYY-MM-DD)',
      ended_on: 'End date (YYYY-MM-DD)',
      time: 'Time per day in minutes',
      total_time: 'Total booked time in minutes',
      note: 'Booking note',
    },
    examples: [
      {
        description: 'List my bookings',
        params: { resource: 'bookings', action: 'list', filter: { person_id: 'me' } },
      },
    ],
  },

  pages: {
    description: 'Manage pages (wiki/docs) within projects',
    actions: {
      list: 'List pages with optional filters',
      get: 'Get a single page by ID with full details',
      create: 'Create a new page (requires title, project_id)',
      update: 'Update an existing page',
      delete: 'Delete a page',
    },
    filters: {
      project_id: 'Filter by project (array)',
      creator_id: 'Filter by creator',
      parent_page_id: 'Filter by parent page (for sub-pages)',
      edited_at: 'Filter by last edited date (ISO 8601)',
    },
    fields: {
      id: 'Unique page identifier',
      title: 'Page title',
      body: 'Page body content (HTML)',
      public: 'Whether the page is publicly accessible',
      version_number: 'Current version number',
      parent_page_id: 'Parent page ID (for sub-pages)',
    },
    examples: [
      {
        description: 'List pages for a project',
        params: { resource: 'pages', action: 'list', filter: { project_id: '12345' } },
      },
      {
        description: 'Get page details',
        params: { resource: 'pages', action: 'get', id: '67890' },
      },
      {
        description: 'Create a page',
        params: {
          resource: 'pages',
          action: 'create',
          title: 'Getting Started',
          project_id: '12345',
        },
      },
      {
        description: 'Create a sub-page',
        params: {
          resource: 'pages',
          action: 'create',
          title: 'Sub-section',
          project_id: '12345',
          parent_page_id: '67890',
        },
      },
      {
        description: 'Delete a page',
        params: { resource: 'pages', action: 'delete', id: '67890' },
      },
    ],
  },

  discussions: {
    description: 'Manage discussions (comment threads on highlighted page content)',
    actions: {
      list: 'List discussions with optional filters',
      get: 'Get a single discussion by ID',
      create: 'Create a new discussion (requires body, page_id)',
      update: 'Update an existing discussion',
      delete: 'Delete a discussion',
      resolve: 'Resolve a discussion (mark as resolved)',
      reopen: 'Reopen a resolved discussion',
    },
    filters: {
      page_id: 'Filter by page',
      status: 'Filter by status: 1=active, 2=resolved',
    },
    fields: {
      id: 'Unique discussion identifier',
      title: 'Discussion title',
      body: 'Discussion body (HTML)',
      status: 'Status: active or resolved',
      resolved_at: 'When the discussion was resolved',
    },
    examples: [
      {
        description: 'List discussions on a page',
        params: { resource: 'discussions', action: 'list', filter: { page_id: '12345' } },
      },
      {
        description: 'List active discussions',
        params: { resource: 'discussions', action: 'list', status: 'active' },
      },
      {
        description: 'Create a discussion',
        params: {
          resource: 'discussions',
          action: 'create',
          page_id: '12345',
          body: 'Review this section',
        },
      },
      {
        description: 'Resolve a discussion',
        params: { resource: 'discussions', action: 'resolve', id: '67890' },
      },
      {
        description: 'Reopen a discussion',
        params: { resource: 'discussions', action: 'reopen', id: '67890' },
      },
    ],
  },

  workflows: {
    description:
      'Compound workflows that chain multiple resource operations into a single tool call. Use these for common multi-step patterns.',
    actions: {
      complete_task: 'Mark a task closed, optionally post a comment, and stop running timers',
      log_day: 'Create multiple time entries in parallel from a structured list',
      weekly_standup: 'Aggregate completed tasks, time logged, and upcoming deadlines for a week',
    },
    fields: {
      task_id: '(complete_task) Required. Task ID to mark as complete',
      comment: '(complete_task) Optional. Completion comment text to post',
      stop_timer: '(complete_task) Optional. Whether to stop running timers (default: true)',
      entries:
        '(log_day) Required. Array of { project_id, service_id, duration_minutes, note?, date? }',
      date: '(log_day) Optional. Default date for all entries (YYYY-MM-DD, defaults to today)',
      person_id: '(log_day / weekly_standup) Optional. Person to act on (defaults to current user)',
      week_start:
        '(weekly_standup) Optional. Monday date of the target week (defaults to this Monday)',
    },
    examples: [
      {
        description: 'Complete a task with a comment',
        params: {
          resource: 'workflows',
          action: 'complete_task',
          task_id: '12345',
          comment: 'Done! All tests passing.',
        },
      },
      {
        description: 'Complete a task without stopping timers',
        params: {
          resource: 'workflows',
          action: 'complete_task',
          task_id: '12345',
          stop_timer: false,
        },
      },
      {
        description: 'Log a full day across multiple projects',
        params: {
          resource: 'workflows',
          action: 'log_day',
          date: '2024-01-16',
          entries: [
            { project_id: '100', service_id: '111', duration_minutes: 240, note: 'Frontend dev' },
            { project_id: '200', service_id: '222', duration_minutes: 120, note: 'Code review' },
            { project_id: '100', service_id: '333', duration_minutes: 60, note: 'Meetings' },
          ],
        },
      },
      {
        description: 'Get this week standup',
        params: {
          resource: 'workflows',
          action: 'weekly_standup',
        },
      },
      {
        description: 'Get standup for a specific past week',
        params: {
          resource: 'workflows',
          action: 'weekly_standup',
          week_start: '2024-01-15',
        },
      },
    ],
  },

  custom_fields: {
    description:
      'Custom field definitions — list and inspect custom fields configured in your organization. ' +
      'Custom fields appear as raw ID hashes on tasks, deals, companies, etc. ' +
      'Use this resource to discover field names, data types, and option values for resolution.',
    actions: {
      list: 'List custom field definitions (filter by customizable_type to scope to a resource)',
      get: 'Get a single custom field definition with its options (include: options)',
    },
    filters: {
      customizable_type:
        'Filter by resource type: Task, Deal, Company, Project, Booking, Service, etc.',
      archived: 'Filter by archived status (boolean)',
      name: 'Filter by field name',
      project_id: 'Filter by project ID',
      global: 'Filter global custom fields (boolean)',
    },
    includes: ['options'],
    fields: {
      id: 'Unique custom field identifier (used as key in custom_fields hash)',
      name: 'Human-readable field name',
      data_type: 'Field type: text, number, select, date, multi-select, person, attachment',
      data_type_id:
        'Numeric type: 1=Text, 2=Number, 3=Select, 4=Date, 5=Multi-select, 6=Person, 7=Attachment',
      customizable_type: 'Resource type this field applies to (e.g. Task, Deal)',
      archived: 'Whether the field is archived',
      required: 'Whether the field is required',
      description: 'Optional description of the field',
      options: 'For select/multi-select: array of {id, value, archived} (when include=options)',
    },
    examples: [
      {
        description: 'List custom fields for tasks',
        params: {
          resource: 'custom_fields',
          action: 'list',
          filter: { customizable_type: 'Task' },
        },
      },
      {
        description: 'Get a custom field with its options',
        params: {
          resource: 'custom_fields',
          action: 'get',
          id: '42236',
          include: ['options'],
        },
      },
      {
        description: 'List all non-archived custom fields',
        params: {
          resource: 'custom_fields',
          action: 'list',
          filter: { archived: 'false' },
        },
      },
    ],
  },

  activities: {
    description:
      'Read-only activity feed — audit log of create/update/delete events across the organization',
    actions: {
      list: 'List recent activities with optional filters',
    },
    filters: {
      event: 'Filter by event type: create, copy, update, delete, etc.',
      type: 'Filter by activity type: 1=Comment, 2=Changeset, 3=Email',
      after: 'Filter to activities after this ISO 8601 timestamp (e.g. 2026-01-01T00:00:00Z)',
      before: 'Filter to activities before this ISO 8601 timestamp',
      person_id: 'Filter by creator person ID (array)',
      project_id: 'Filter by project ID (array)',
      company_id: 'Filter by company ID (array)',
      task_id: 'Filter by task ID (array)',
      deal_id: 'Filter by deal ID (array)',
      discussion_id: 'Filter by discussion ID (array)',
      booking_id: 'Filter by booking ID (array)',
      invoice_id: 'Filter by invoice ID (array)',
      item_type: 'Filter by resource type (e.g. Task, Page, Deal, Workspace)',
      parent_type: 'Filter by parent resource type (e.g. Task, Page, Deal)',
      root_type: 'Filter by root resource type (e.g. Workspace, Page, Person)',
      participant_id: 'Filter by participant person ID',
      has_attachments: 'Filter activities with attachments (boolean)',
      pinned: 'Filter pinned activities (boolean)',
    },
    includes: ['creator'],
    fields: {
      id: 'Unique activity identifier',
      event: 'Event type: create, update, or delete',
      changeset: 'Human-readable summary of field changes (e.g. "name: null → My Project")',
      created_at: 'When the activity occurred (ISO 8601)',
      creator_name: 'Full name of the person who triggered the activity (when creator included)',
    },
    examples: [
      {
        description: 'List recent activities',
        params: { resource: 'activities', action: 'list' },
      },
      {
        description: 'List only create events',
        params: { resource: 'activities', action: 'list', filter: { event: 'create' } },
      },
      {
        description: 'List activities in a date range',
        params: {
          resource: 'activities',
          action: 'list',
          filter: { after: '2026-02-01T00:00:00Z', before: '2026-03-01T00:00:00Z' },
        },
      },
      {
        description: 'List activities by a specific person',
        params: {
          resource: 'activities',
          action: 'list',
          filter: { person_id: '12345' },
        },
      },
      {
        description: 'List task-related activities for a project',
        params: {
          resource: 'activities',
          action: 'list',
          filter: { project_id: '12345', item_type: 'Task' },
        },
      },
    ],
  },

  reports: {
    description: 'Generate various reports (time, budget, project, etc.)',
    actions: {
      get: 'Generate a report (requires report_type)',
    },
    filters: {
      person_id: 'Filter by person',
      project_id: 'Filter by project',
      company_id: 'Filter by company',
      after: 'Filter from date (YYYY-MM-DD)',
      before: 'Filter to date (YYYY-MM-DD)',
    },
    fields: {
      report_type:
        'Type of report: time_reports, project_reports, budget_reports, person_reports, invoice_reports, payment_reports, service_reports, task_reports, company_reports, deal_reports, timesheet_reports',
      group: 'Grouping dimension (varies by report type)',
      from: 'Start date for date range',
      to: 'End date for date range',
    },
    examples: [
      {
        description: 'Time report by person',
        params: {
          resource: 'reports',
          action: 'get',
          report_type: 'time_reports',
          group: 'person',
          from: '2024-01-01',
          to: '2024-01-31',
        },
      },
      {
        description: 'Project budget report',
        params: {
          resource: 'reports',
          action: 'get',
          report_type: 'budget_reports',
          filter: { project_id: '12345' },
        },
      },
    ],
  },
};

/**
 * Handle help action - returns documentation for a specific resource
 */
export function handleHelp(resource: string): ToolResult {
  const help = RESOURCE_HELP[resource];

  if (!help) {
    return jsonResult({
      error: `Unknown resource: ${resource}`,
      available_resources: Object.keys(RESOURCE_HELP),
      _tip: "Call { action: 'help' } without a resource to see all available resources.",
    });
  }

  return jsonResult({
    resource,
    ...help,
  });
}

/**
 * Get help for all resources (overview)
 */
export function handleHelpOverview(): ToolResult {
  const overview = Object.entries(RESOURCE_HELP).map(([resource, help]) => ({
    resource,
    description: help.description,
    actions: Object.keys(help.actions),
  }));

  return jsonResult({
    message: 'Use action="help" with a specific resource for detailed documentation',
    resources: overview,
    _tip: "Always call { action: 'help', resource: '<name>' } before your first interaction with any resource to learn valid filters, required fields, and examples.",
  });
}
