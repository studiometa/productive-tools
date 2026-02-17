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
  projects: {
    description: 'Manage projects in Productive.io',
    actions: {
      list: 'List all projects with optional filters',
      get: 'Get a single project by ID (supports PRJ-123, P-123 format)',
      resolve: 'Resolve by project number (PRJ-123, P-123)',
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
        description: 'List active projects',
        params: { resource: 'projects', action: 'list', filter: { archived: 'false' } },
      },
      {
        description: 'Get project details',
        params: { resource: 'projects', action: 'get', id: '12345' },
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
    },
    filters: {
      query: 'Text search on task title',
      project_id: 'Filter by project',
      company_id: 'Filter by company',
      assignee_id: 'Filter by assigned person',
      creator_id: 'Filter by task creator',
      status: 'Filter by status: 1=open, 2=closed (or "open", "closed", "all")',
      task_list_id: 'Filter by task list',
      board_id: 'Filter by board',
      workflow_status_id: 'Filter by workflow status (kanban column)',
      parent_task_id: 'Filter by parent task (for subtasks)',
      overdue_status: 'Filter by overdue: 1=not overdue, 2=overdue',
      due_date_on: 'Filter by exact due date (YYYY-MM-DD)',
      due_date_before: 'Filter by due date before (YYYY-MM-DD)',
      due_date_after: 'Filter by due date after (YYYY-MM-DD)',
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
        description: 'List open tasks for a project',
        params: {
          resource: 'tasks',
          action: 'list',
          filter: { project_id: '12345', status: 'open' },
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
      person_id: 'Filter by person (use "me" for current user)',
      service_id: 'Filter by service',
      project_id: 'Filter by project',
      task_id: 'Filter by task',
      company_id: 'Filter by company',
      deal_id: 'Filter by deal',
      budget_id: 'Filter by budget',
      after: 'Filter entries after date (YYYY-MM-DD)',
      before: 'Filter entries before date (YYYY-MM-DD)',
      status: 'Filter by approval status: 1=approved, 2=unapproved, 3=rejected',
      billing_type_id: 'Filter by billing type: 1=fixed, 2=actuals, 3=non_billable',
      invoicing_status: 'Filter by invoicing: 1=not_invoiced, 2=drafted, 3=finalized',
    },
    fields: {
      id: 'Unique time entry identifier',
      date: 'Date of the entry (YYYY-MM-DD)',
      time: 'Time in minutes',
      note: 'Description of work done',
      billable_time: 'Billable time in minutes',
      approved: 'Whether the entry is approved',
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
      project_id: 'Filter by project',
      deal_id: 'Filter by deal',
      task_id: 'Filter by task',
      person_id: 'Filter by person (trackable by)',
      budget_status: 'Filter by budget status: 1=open, 2=delivered',
      billing_type: 'Filter by billing type: 1=fixed, 2=actuals, 3=none',
      time_tracking_enabled: 'Filter by time tracking: true/false',
    },
    fields: {
      id: 'Unique service identifier',
      name: 'Service name',
      budgeted_time: 'Budgeted time in minutes',
      worked_time: 'Logged time in minutes',
    },
    examples: [
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
      status: 'Filter by status: 1=active, 2=deactivated',
      person_type: 'Filter by type: 1=user, 2=contact, 3=placeholder',
      company_id: 'Filter by company',
      project_id: 'Filter by project',
      role_id: 'Filter by role',
      team: 'Filter by team name',
    },
    fields: {
      id: 'Unique person identifier',
      name: 'Full name',
      first_name: 'First name',
      last_name: 'Last name',
      email: 'Email address',
      title: 'Job title',
      active: 'Whether the person is active',
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
      archived: 'Filter by archived status (true/false)',
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
    description: 'File attachments on tasks, comments, deals, and pages',
    actions: {
      list: 'List attachments with optional filters',
      get: 'Get a single attachment by ID',
      delete: 'Delete an attachment by ID',
    },
    filters: {
      task_id: 'Filter by task',
      comment_id: 'Filter by comment',
      deal_id: 'Filter by deal',
      page_id: 'Filter by page',
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
      deal_id: 'Filter by deal',
      project_id: 'Filter by project',
      page_id: 'Filter by page',
      discussion_id: 'Filter by discussion',
    },
    includes: ['creator', 'task', 'deal'],
    fields: {
      id: 'Unique comment identifier',
      body: 'Comment text (may contain HTML)',
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
    },
    filters: {
      query: 'Text search on deal name',
      company_id: 'Filter by company',
      project_id: 'Filter by project',
      responsible_id: 'Filter by responsible person',
      pipeline_id: 'Filter by pipeline',
      stage_status_id: 'Filter by stage: 1=open, 2=won, 3=lost',
      type: 'Filter by type: 1=deal, 2=budget',
      budget_status: 'Filter by budget status: 1=open, 2=closed',
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
      person_id: 'Filter by person',
      service_id: 'Filter by service',
      project_id: 'Filter by project',
      company_id: 'Filter by company',
      event_id: 'Filter by event',
      after: 'Filter bookings after date (YYYY-MM-DD)',
      before: 'Filter bookings before date (YYYY-MM-DD)',
      booking_type: 'Filter by type: event (absence) or service (budget)',
      draft: 'Filter by tentative status: true/false',
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
      project_id: 'Filter by project',
      creator_id: 'Filter by creator',
      parent_page_id: 'Filter by parent page (for sub-pages)',
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
  });
}
