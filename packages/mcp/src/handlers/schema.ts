/**
 * Schema handler - provides compact, machine-readable resource specifications
 *
 * More concise than action=help, optimized for LLM consumption when only
 * field metadata is needed (filters, create fields, includes).
 */

import type { ToolResult } from './types.js';

import { errorResult, jsonResult } from './utils.js';

/**
 * Field specification for create/update operations
 */
export interface ResourceFieldSpec {
  required: boolean;
  type: string;
}

/**
 * Compact schema data for a resource
 */
export interface ResourceSchemaData {
  actions: string[];
  filters: Record<string, string>;
  create?: Record<string, ResourceFieldSpec>;
  update?: string[];
  includes?: string[];
}

/**
 * Schema definitions for all resources.
 *
 * This provides a compact, machine-readable specification of each resource's
 * capabilities. For detailed documentation with examples, use action=help.
 */
const RESOURCE_SCHEMAS: Record<string, ResourceSchemaData> = {
  projects: {
    actions: ['list', 'get', 'resolve'],
    filters: {
      query: 'string — text search on project name',
      project_type: '1=internal|2=client',
      company_id: 'string',
      responsible_id: 'string',
      person_id: 'string',
      status: '1=active|2=archived',
    },
  },

  time: {
    actions: ['list', 'get', 'create', 'update', 'delete'],
    filters: {
      person_id: "string|array — use 'me' for current user",
      after: 'date YYYY-MM-DD',
      before: 'date YYYY-MM-DD',
      date: 'date YYYY-MM-DD — exact date',
      project_id: 'string|array',
      service_id: 'string|array',
      task_id: 'string|array',
      company_id: 'string|array',
      deal_id: 'string|array',
      budget_id: 'string|array',
      status: '1=approved|2=unapproved|3=rejected',
      billing_type_id: '1=fixed|2=actuals|3=non_billable',
      invoicing_status: '1=not_invoiced|2=drafted|3=finalized',
      invoiced: 'boolean',
      creator_id: 'string|array',
      approver_id: 'string|array',
      booking_id: 'string|array',
      autotracked: 'boolean',
    },
    create: {
      person_id: { required: true, type: 'string' },
      service_id: { required: true, type: 'string' },
      date: { required: true, type: 'date YYYY-MM-DD' },
      time: { required: true, type: 'minutes integer' },
      note: { required: false, type: 'string' },
      task_id: { required: false, type: 'string' },
    },
    update: ['time', 'billable_time', 'date', 'note'],
    includes: ['person', 'service', 'task'],
  },

  tasks: {
    actions: ['list', 'get', 'create', 'update', 'resolve'],
    filters: {
      query: 'string — text search on task title',
      project_id: 'string|array',
      company_id: 'string|array',
      assignee_id: 'string|array',
      creator_id: 'string|array',
      status: '1=open|2=closed (or "open", "closed", "all")',
      task_list_id: 'string|array',
      task_list_status: '1=open|2=closed',
      board_id: 'string|array',
      workflow_status_id: 'string|array — kanban column',
      workflow_status_category_id: '1=not started|2=started|3=closed',
      workflow_id: 'string|array',
      parent_task_id: 'string|array — for subtasks',
      task_type: '1=parent task|2=subtask',
      overdue_status: '1=not overdue|2=overdue',
      due_date_on: 'date YYYY-MM-DD',
      due_date_before: 'date YYYY-MM-DD',
      due_date_after: 'date YYYY-MM-DD',
      start_date_before: 'date YYYY-MM-DD',
      start_date_after: 'date YYYY-MM-DD',
      after: 'date YYYY-MM-DD — created after',
      before: 'date YYYY-MM-DD — created before',
      closed_after: 'date YYYY-MM-DD',
      closed_before: 'date YYYY-MM-DD',
      project_manager_id: 'string|array',
      subscriber_id: 'string|array',
      tags: 'string',
    },
    create: {
      title: { required: true, type: 'string' },
      project_id: { required: true, type: 'string' },
      task_list_id: { required: true, type: 'string' },
      description: { required: false, type: 'string' },
      assignee_id: { required: false, type: 'string' },
    },
    includes: ['project', 'assignee', 'comments', 'subtasks', 'workflow_status'],
  },

  services: {
    actions: ['list', 'get'],
    filters: {
      project_id: 'string|array',
      deal_id: 'string|array',
      task_id: 'string|array',
      person_id: 'string|array',
      name: 'string — text match',
      budget_status: '1=open|2=delivered',
      stage_status_id: '1=open|2=won|3=lost|4=delivered (array)',
      billing_type: '1=fixed|2=actuals|3=none',
      unit: '1=hour|2=piece|3=day',
      time_tracking_enabled: 'boolean',
      expense_tracking_enabled: 'boolean',
      trackable_by_person_id: 'string',
      after: 'date YYYY-MM-DD',
      before: 'date YYYY-MM-DD',
    },
  },

  people: {
    actions: ['list', 'get', 'me', 'resolve'],
    filters: {
      query: 'string — text search on name or email',
      email: 'string — exact email address',
      status: '1=active|2=deactivated',
      person_type: '1=user|2=contact|3=placeholder',
      company_id: 'string|array',
      project_id: 'string',
      role_id: 'string|array',
      team: 'string',
      manager_id: 'string',
      custom_role_id: 'string',
      tags: 'string',
    },
  },

  companies: {
    actions: ['list', 'get', 'create', 'update', 'resolve'],
    filters: {
      query: 'string — text search on company name',
      name: 'string — exact name match',
      company_code: 'string',
      billing_name: 'string',
      vat: 'string',
      status: 'integer',
      archived: 'boolean',
      project_id: 'string|array',
      subsidiary_id: 'string|array',
      default_currency: 'string — e.g. USD, EUR',
    },
    create: {
      name: { required: true, type: 'string' },
    },
  },

  comments: {
    actions: ['list', 'get', 'create', 'update'],
    filters: {
      task_id: 'string',
      project_id: 'string|array',
      page_id: 'string|array',
      discussion_id: 'string',
      draft: 'boolean',
      workflow_status_category_id: 'string|array',
    },
    create: {
      body: { required: true, type: 'string' },
      hidden: { required: false, type: 'boolean — true to hide from client' },
      task_id: { required: false, type: 'string — one of task_id, deal_id required' },
      deal_id: { required: false, type: 'string — one of task_id, deal_id required' },
    },
    update: ['body', 'hidden'],
    includes: ['creator'],
  },

  attachments: {
    actions: ['list', 'get', 'delete'],
    filters: {
      task_id: 'string|array',
      comment_id: 'string|array',
      page_id: 'string|array',
    },
  },

  timers: {
    actions: ['list', 'get', 'start', 'stop'],
    filters: {
      person_id: 'string',
      time_entry_id: 'string',
      started_at: 'date ISO 8601',
      stopped_at: 'date ISO 8601',
    },
  },

  deals: {
    actions: ['list', 'get', 'create', 'update', 'resolve'],
    filters: {
      query: 'string — text search on deal name',
      number: 'string — deal number',
      company_id: 'string|array',
      project_id: 'string|array',
      responsible_id: 'string|array',
      creator_id: 'string|array',
      pipeline_id: 'string|array',
      status_id: 'string|array',
      stage_status_id: '1=open|2=won|3=lost (array)',
      type: '1=deal|2=budget',
      deal_type_id: '1=internal|2=client',
      budget_status: '1=open|2=closed',
      project_type: '1=internal project|2=client project',
      subsidiary_id: 'string|array',
      tags: 'string',
      recurring: 'boolean',
      needs_invoicing: 'boolean',
      time_approval: 'boolean',
    },
    create: {
      name: { required: true, type: 'string' },
      company_id: { required: true, type: 'string' },
    },
    includes: ['company', 'deal_status'],
  },

  bookings: {
    actions: ['list', 'get', 'create', 'update'],
    filters: {
      person_id: 'string|array',
      service_id: 'string',
      project_id: 'string|array',
      company_id: 'string|array',
      event_id: 'string|array',
      task_id: 'string|array',
      approver_id: 'string|array',
      after: 'date YYYY-MM-DD',
      before: 'date YYYY-MM-DD',
      started_on: 'date YYYY-MM-DD',
      ended_on: 'date YYYY-MM-DD',
      booking_type: 'event|service',
      draft: 'boolean — tentative only',
      with_draft: 'boolean — include tentative',
      status: 'string|array — approval status alias',
      approval_status: 'string|array',
      billing_type_id: '1=fixed|2=actuals|3=none (array)',
      person_type: '1=user|2=contact|3=placeholder',
      canceled: 'boolean',
    },
    create: {
      person_id: { required: true, type: 'string' },
      started_on: { required: true, type: 'date YYYY-MM-DD' },
      ended_on: { required: true, type: 'date YYYY-MM-DD' },
      service_id: { required: false, type: 'string — one of service_id, event_id required' },
      event_id: { required: false, type: 'string — one of service_id, event_id required' },
    },
  },

  pages: {
    actions: ['list', 'get', 'create', 'update', 'delete'],
    filters: {
      project_id: 'string|array',
      creator_id: 'string',
      edited_at: 'date ISO 8601',
    },
    create: {
      title: { required: true, type: 'string' },
      project_id: { required: true, type: 'string' },
      body: { required: false, type: 'string' },
      parent_page_id: { required: false, type: 'string' },
    },
  },

  discussions: {
    actions: ['list', 'get', 'create', 'update', 'delete', 'resolve', 'reopen'],
    filters: {
      page_id: 'string',
      status: '1=active|2=resolved',
    },
    create: {
      body: { required: true, type: 'string' },
      page_id: { required: true, type: 'string' },
    },
  },

  custom_fields: {
    actions: ['list', 'get'],
    filters: {
      customizable_type: 'string — Task, Deal, Company, Project, Booking, Service, etc.',
      archived: 'boolean',
      name: 'string',
      project_id: 'string',
      global: 'boolean',
    },
    includes: ['options'],
  },

  activities: {
    actions: ['list'],
    filters: {
      event: 'string — create, copy, update, delete, etc.',
      type: '1=Comment|2=Changeset|3=Email',
      after: 'date ISO 8601',
      before: 'date ISO 8601',
      person_id: 'string|array',
      project_id: 'string|array',
      company_id: 'string|array',
      task_id: 'string|array',
      deal_id: 'string|array',
      discussion_id: 'string|array',
      booking_id: 'string|array',
      invoice_id: 'string|array',
      item_type: 'string — Task, Page, Deal, Workspace, etc.',
      parent_type: 'string — Task, Page, Deal, etc.',
      root_type: 'string — Workspace, Page, Person, etc.',
      participant_id: 'string',
      has_attachments: 'boolean',
      pinned: 'boolean',
    },
    includes: ['creator'],
  },

  reports: {
    actions: ['get'],
    filters: {
      person_id: 'string',
      project_id: 'string',
      company_id: 'string',
      after: 'date YYYY-MM-DD',
      before: 'date YYYY-MM-DD',
    },
    create: {
      report_type: { required: true, type: 'time_reports|project_reports|budget_reports|...' },
      from: { required: false, type: 'date YYYY-MM-DD' },
      to: { required: false, type: 'date YYYY-MM-DD' },
      group: { required: false, type: 'string — grouping dimension' },
    },
  },
};

/**
 * Handle schema action - returns compact specification for a specific resource
 */
export function handleSchema(resource: string): ToolResult {
  const schema = RESOURCE_SCHEMAS[resource];

  if (!schema) {
    return errorResult(
      `Unknown resource: ${resource}. Valid resources: ${Object.keys(RESOURCE_SCHEMAS).join(', ')}`,
    );
  }

  return jsonResult({
    resource,
    ...schema,
  });
}

/**
 * Get schema overview for all resources
 */
export function handleSchemaOverview(): ToolResult {
  const overview = Object.entries(RESOURCE_SCHEMAS).map(([resource, schema]) => ({
    resource,
    actions: schema.actions,
  }));

  return jsonResult({
    _tip: 'Use action="schema" with a specific resource for full filter/create/includes spec',
    resources: overview,
  });
}
