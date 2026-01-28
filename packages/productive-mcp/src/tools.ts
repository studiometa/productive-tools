import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool definitions for Productive.io MCP server
 * These are shared between stdio and HTTP transports
 */
export const TOOLS: Tool[] = [
  {
    name: 'productive_list_projects',
    description: 'List projects from Productive.io with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'Filters to apply',
          properties: {
            board_id: { type: 'string', description: 'Filter by board ID' },
            company_id: { type: 'string', description: 'Filter by company ID' },
            project_manager_id: { type: 'string', description: 'Filter by project manager ID' },
            workflow_status: { type: 'string', description: 'Filter by workflow status' },
          },
        },
        page: { type: 'number', description: 'Page number (default: 1)' },
        per_page: { type: 'number', description: 'Items per page (default: 50, max: 200)' },
      },
    },
  },
  {
    name: 'productive_get_project',
    description: 'Get details for a specific project by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Project ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'productive_list_time_entries',
    description: 'List time entries with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'Filters to apply',
          properties: {
            person_id: { type: 'string', description: 'Filter by person ID' },
            project_id: { type: 'string', description: 'Filter by project ID' },
            service_id: { type: 'string', description: 'Filter by service ID' },
            task_id: { type: 'string', description: 'Filter by task ID' },
            after: { type: 'string', description: 'After date (YYYY-MM-DD)' },
            before: { type: 'string', description: 'Before date (YYYY-MM-DD)' },
          },
        },
        page: { type: 'number', description: 'Page number (default: 1)' },
        per_page: { type: 'number', description: 'Items per page (default: 50, max: 200)' },
      },
    },
  },
  {
    name: 'productive_get_time_entry',
    description: 'Get details for a specific time entry by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Time entry ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'productive_create_time_entry',
    description: 'Create a new time entry',
    inputSchema: {
      type: 'object',
      properties: {
        person_id: { type: 'string', description: 'Person ID' },
        service_id: { type: 'string', description: 'Service ID' },
        time: { type: 'number', description: 'Time in minutes' },
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        note: { type: 'string', description: 'Note/description' },
        task_id: { type: 'string', description: 'Task ID (optional)' },
      },
      required: ['person_id', 'service_id', 'time', 'date'],
    },
  },
  {
    name: 'productive_update_time_entry',
    description: 'Update an existing time entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Time entry ID' },
        time: { type: 'number', description: 'Time in minutes' },
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        note: { type: 'string', description: 'Note/description' },
        service_id: { type: 'string', description: 'Service ID' },
        task_id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'productive_delete_time_entry',
    description: 'Delete a time entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Time entry ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'productive_list_tasks',
    description: 'List tasks with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'Filters to apply',
          properties: {
            project_id: { type: 'string', description: 'Filter by project ID' },
            assignee_id: { type: 'string', description: 'Filter by assignee ID' },
            task_list_id: { type: 'string', description: 'Filter by task list ID' },
            workflow_status_id: { type: 'string', description: 'Filter by workflow status ID' },
          },
        },
        page: { type: 'number', description: 'Page number (default: 1)' },
        per_page: { type: 'number', description: 'Items per page (default: 50, max: 200)' },
      },
    },
  },
  {
    name: 'productive_get_task',
    description: 'Get details for a specific task by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'productive_list_services',
    description: 'List services (budget line items) with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'Filters to apply',
          properties: {
            project_id: { type: 'string', description: 'Filter by project ID' },
            deal_id: { type: 'string', description: 'Filter by deal ID' },
          },
        },
        page: { type: 'number', description: 'Page number (default: 1)' },
        per_page: { type: 'number', description: 'Items per page (default: 50, max: 200)' },
      },
    },
  },
  {
    name: 'productive_list_people',
    description: 'List people from the organization',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          description: 'Filters to apply',
          properties: {
            archived: { type: 'boolean', description: 'Filter by archived status' },
          },
        },
        page: { type: 'number', description: 'Page number (default: 1)' },
        per_page: { type: 'number', description: 'Items per page (default: 50, max: 200)' },
      },
    },
  },
  {
    name: 'productive_get_person',
    description: 'Get details for a specific person by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Person ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'productive_get_current_user',
    description: 'Get the current authenticated user information',
    inputSchema: {
      type: 'object',
      properties: {},
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
    description: 'Configure Productive.io credentials (organization ID, API token, and optionally user ID)',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string', description: 'Your Productive.io organization ID' },
        apiToken: { type: 'string', description: 'Your Productive.io API token' },
        userId: { type: 'string', description: 'Your Productive.io user ID (optional, for time entries)' },
      },
      required: ['organizationId', 'apiToken'],
    },
  },
  {
    name: 'productive_get_config',
    description: 'Get current Productive.io configuration (without exposing the API token)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
