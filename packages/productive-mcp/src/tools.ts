import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Single consolidated tool for Productive.io MCP server
 *
 * Optimized for minimal token overhead (~170 tokens vs ~1300 for individual tools)
 */
export const TOOLS: Tool[] = [
  {
    name: 'productive',
    description:
      'Productive.io API. Resources: projects, time, tasks, services, people, companies, comments, timers, deals, bookings, reports. Actions: list, get, create, update (varies by resource), start/stop (timers), me (people), help (documentation). Use query for text search on list actions. Reports: use resource=reports, action=get with report_type. Filters: project_id, person_id, service_id, company_id, after/before (dates). Use include to fetch related data. Use compact=false for full details (default for get, true for list). Use action=help with a resource for detailed documentation.',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          enum: [
            'projects',
            'time',
            'tasks',
            'services',
            'people',
            'companies',
            'comments',
            'timers',
            'deals',
            'bookings',
            'reports',
          ],
        },
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'me', 'start', 'stop', 'help'],
          description: 'Action to perform. Use "help" for detailed documentation on a resource.',
        },
        id: { type: 'string' },
        filter: { type: 'object' },
        page: { type: 'number' },
        per_page: { type: 'number' },
        compact: {
          type: 'boolean',
          description: 'Compact output (default: true for list, false for get)',
        },
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'Related resources to include (e.g., ["project", "assignee", "comments"])',
        },
        query: {
          type: 'string',
          description: 'Text search query for list actions (searches name/title fields)',
        },
        // Common fields
        person_id: { type: 'string' },
        service_id: { type: 'string' },
        task_id: { type: 'string' },
        company_id: { type: 'string' },
        time: { type: 'number' },
        date: { type: 'string' },
        note: { type: 'string' },
        // Task fields
        title: { type: 'string' },
        project_id: { type: 'string' },
        task_list_id: { type: 'string' },
        description: { type: 'string' },
        assignee_id: { type: 'string' },
        // Company fields
        name: { type: 'string' },
        // Comment fields
        body: { type: 'string' },
        deal_id: { type: 'string' },
        // Timer fields
        time_entry_id: { type: 'string' },
        // Booking fields
        started_on: { type: 'string' },
        ended_on: { type: 'string' },
        event_id: { type: 'string' },
        // Report fields
        report_type: {
          type: 'string',
          enum: [
            'time_reports',
            'project_reports',
            'budget_reports',
            'person_reports',
            'invoice_reports',
            'payment_reports',
            'service_reports',
            'task_reports',
            'company_reports',
            'deal_reports',
            'timesheet_reports',
          ],
        },
        group: { type: 'string' },
        from: { type: 'string' },
        to: { type: 'string' },
        status: { type: 'string' },
      },
      required: ['resource', 'action'],
    },
  },
];

/**
 * Additional tools only available in stdio mode (local execution)
 * These tools manage persistent configuration
 */
export const STDIO_ONLY_TOOLS: Tool[] = [
  {
    name: 'productive_configure',
    description: 'Configure Productive.io credentials',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        apiToken: { type: 'string' },
        userId: { type: 'string' },
      },
      required: ['organizationId', 'apiToken'],
    },
  },
  {
    name: 'productive_get_config',
    description: 'Get current configuration',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
