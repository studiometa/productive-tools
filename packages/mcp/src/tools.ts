import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { RESOURCES, ACTIONS, REPORT_TYPES } from '@studiometa/productive-core';

/**
 * Generate the tool description dynamically from the constants.
 * Adding a resource or action to constants.ts automatically updates this description.
 */
function generateDescription(): string {
  return [
    'Productive.io API.',
    `Resources: ${RESOURCES.join(', ')}.`,
    `Actions: ${ACTIONS.join(', ')} (varies by resource).`,
    'Discovery: action=help with any resource for filters, fields, examples. action=schema for compact machine-readable spec.',
    'Filters: filter:{key:value}. Common: project_id, person_id, after/before (YYYY-MM-DD).',
    'Includes: include:[...] for related data (e.g. ["project","assignee"]).',
    'Output: compact=false for full detail (default for get; list defaults true).',
    'Search: query for text search on list actions. Cross-resource: resource=search action=run with query searches projects, companies, people, tasks simultaneously.',
    'Reports: resource=reports action=get with report_type, from, to.',
    'Batch: resource=batch action=run with operations=[{resource,action,...}] executes up to 10 ops in parallel.',
    'Rich context: action=context on tasks/projects/deals for full context in one call.',
  ].join('\n');
}

/**
 * Single consolidated tool for Productive.io MCP server
 *
 * The resource/action/report_type enums and description are derived from
 * the shared constants in constants.ts — the single source of truth for both
 * the MCP tool definition and the Zod validation schemas.
 * Adding a new resource, action, or report type there automatically updates
 * both the tool exposed to clients and the validation layer.
 *
 * MCP Annotations (for MCP directory compliance):
 * - readOnlyHint: false - Tool can create/update data
 * - destructiveHint: false - Tool does not permanently delete data
 * - idempotentHint: false - Create actions are not idempotent
 * - openWorldHint: true - Tool interacts with external Productive.io API
 */
export const TOOLS: Tool[] = [
  {
    name: 'productive',
    description: generateDescription(),
    annotations: {
      title: 'Productive.io',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        resource: {
          type: 'string',
          enum: [...RESOURCES],
        },
        action: {
          type: 'string',
          enum: [...ACTIONS],
          description: 'Use "help" for resource documentation',
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
          description: 'Related data to include (e.g. ["project","assignee"])',
        },
        query: { type: 'string', description: 'Text search for list actions' },
        resources: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Resource types to search (for resource=search). Defaults to [projects, companies, people, tasks]. Valid values: projects, companies, people, tasks, deals.',
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
        // Page fields
        page_id: { type: 'string', description: 'Page ID (list pages to find)' },
        parent_page_id: { type: 'string', description: 'Parent page ID for sub-pages' },
        // Comment fields
        body: { type: 'string', description: 'Comment/page body content' },
        deal_id: { type: 'string' },
        // Attachment fields
        comment_id: { type: 'string', description: 'Comment ID (for attachments)' },
        // Timer fields
        time_entry_id: { type: 'string' },
        // Booking fields
        started_on: { type: 'string', description: 'Booking date (YYYY-MM-DD)' },
        ended_on: { type: 'string', description: 'Booking end date (YYYY-MM-DD)' },
        event_id: { type: 'string' },
        // Report fields
        report_type: {
          type: 'string',
          enum: [...REPORT_TYPES],
          description: 'Required for resource=reports action=get',
        },
        group: { type: 'string', description: 'Report grouping: person, project, service' },
        from: { type: 'string', description: 'Report start (YYYY-MM-DD); filter.after for time' },
        to: { type: 'string', description: 'Report end (YYYY-MM-DD); filter.before for time' },
        status: { type: 'string' },
        // Batch fields
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              action: { type: 'string' },
            },
            required: ['resource', 'action'],
          },
          maxItems: 10,
          description:
            'Array of operations for batch execution (max 10). Each operation needs resource, action, and any additional params.',
        },
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
    annotations: {
      title: 'Configure Productive',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Get Productive Config',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];
