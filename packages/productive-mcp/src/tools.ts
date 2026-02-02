import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Consolidated tool definitions for Productive.io MCP server
 *
 * Tools are consolidated to reduce token overhead:
 * - 5 tools instead of 13 (70% reduction in tool list size)
 * - Each tool uses an `action` parameter to specify the operation
 * - Compact output mode available via `compact` parameter
 */
export const TOOLS: Tool[] = [
  {
    name: 'productive_projects',
    description:
      'Manage Productive.io projects. Actions: list (with filters), get (by ID).',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get'],
          description: 'Action: list or get',
        },
        id: {
          type: 'string',
          description: 'Project ID (required for get)',
        },
        filter: {
          type: 'object',
          description: 'Filters for list action',
          properties: {
            company_id: { type: 'string' },
            project_manager_id: { type: 'string' },
          },
        },
        page: { type: 'number' },
        per_page: { type: 'number', description: 'Items per page (default: 20, max: 200)' },
        compact: { type: 'boolean', description: 'Compact output (fewer fields)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'productive_time',
    description:
      'Manage time entries. Actions: list, get, create, update, delete.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'delete'],
          description: 'Action to perform',
        },
        id: {
          type: 'string',
          description: 'Time entry ID (required for get/update/delete)',
        },
        filter: {
          type: 'object',
          description: 'Filters for list action',
          properties: {
            person_id: { type: 'string' },
            project_id: { type: 'string' },
            service_id: { type: 'string' },
            after: { type: 'string', description: 'After date (YYYY-MM-DD)' },
            before: { type: 'string', description: 'Before date (YYYY-MM-DD)' },
          },
        },
        // Create/update fields
        person_id: { type: 'string', description: 'Person ID (for create)' },
        service_id: { type: 'string', description: 'Service ID (for create)' },
        time: { type: 'number', description: 'Time in minutes (for create/update)' },
        date: { type: 'string', description: 'Date YYYY-MM-DD (for create/update)' },
        note: { type: 'string', description: 'Note (for create/update)' },
        task_id: { type: 'string', description: 'Task ID (for create)' },
        page: { type: 'number' },
        per_page: { type: 'number', description: 'Items per page (default: 20, max: 200)' },
        compact: { type: 'boolean', description: 'Compact output (fewer fields)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'productive_tasks',
    description: 'View tasks. Actions: list (with filters), get (by ID).',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get'],
          description: 'Action: list or get',
        },
        id: {
          type: 'string',
          description: 'Task ID (required for get)',
        },
        filter: {
          type: 'object',
          description: 'Filters for list action',
          properties: {
            project_id: { type: 'string' },
            assignee_id: { type: 'string' },
            task_list_id: { type: 'string' },
          },
        },
        page: { type: 'number' },
        per_page: { type: 'number', description: 'Items per page (default: 20, max: 200)' },
        compact: { type: 'boolean', description: 'Compact output (omits description)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'productive_services',
    description: 'List services (budget line items) with optional project filter.',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list'],
          description: 'Action: list',
        },
        filter: {
          type: 'object',
          description: 'Filters',
          properties: {
            project_id: { type: 'string' },
            deal_id: { type: 'string' },
          },
        },
        page: { type: 'number' },
        per_page: { type: 'number', description: 'Items per page (default: 20, max: 200)' },
        compact: { type: 'boolean', description: 'Compact output (fewer fields)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'productive_people',
    description:
      'View people. Actions: list, get (by ID), me (current user).',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'me'],
          description: 'Action: list, get, or me',
        },
        id: {
          type: 'string',
          description: 'Person ID (required for get)',
        },
        filter: {
          type: 'object',
          description: 'Filters for list action',
          properties: {
            archived: { type: 'boolean' },
          },
        },
        page: { type: 'number' },
        per_page: { type: 'number', description: 'Items per page (default: 20, max: 200)' },
        compact: { type: 'boolean', description: 'Compact output (fewer fields)' },
      },
      required: ['action'],
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
    description:
      'Configure Productive.io credentials (organization ID, API token, user ID)',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'Organization ID' },
        apiToken: { type: 'string', description: 'API token' },
        userId: { type: 'string', description: 'User ID (optional)' },
      },
      required: ['organizationId', 'apiToken'],
    },
  },
  {
    name: 'productive_get_config',
    description: 'Get current configuration (without exposing API token)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
