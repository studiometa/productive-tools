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
      'Productive.io API. Resources: projects, time, tasks, services, people, companies, comments, timers, deals, bookings. Actions: list, get, create, update (varies by resource), start/stop (timers), me (people). Filters: project_id, person_id, service_id, company_id, after/before (dates).',
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          enum: ['projects', 'time', 'tasks', 'services', 'people', 'companies', 'comments', 'timers', 'deals', 'bookings'],
        },
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'me', 'start', 'stop'],
        },
        id: { type: 'string' },
        filter: { type: 'object' },
        page: { type: 'number' },
        per_page: { type: 'number' },
        compact: { type: 'boolean' },
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
