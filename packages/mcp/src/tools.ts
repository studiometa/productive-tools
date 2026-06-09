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
    'Discovery: action=help with a resource for filters/fields/examples, action=help with query to search across resources, action=schema for a compact spec. Or use the search_docs tool to discover across resources, raw endpoints, and scripting.',
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
        hidden: {
          type: 'boolean',
          description: 'Set to true to hide comment from client (comments only)',
        },
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
  {
    name: 'api_read',
    description:
      'Read-only raw Productive API access for documented GET endpoints. Use search="<term>" to discover endpoints, describe=true for an endpoint spec, or path + filter/include/sort with optional safe pagination.',
    annotations: {
      title: 'Productive API Read',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative Productive API path, e.g. /invoices' },
        search: {
          type: 'string',
          description:
            'Find documented endpoints by keyword (returns matching paths). Use instead of path.',
        },
        describe: {
          type: 'boolean',
          description: 'Return endpoint documentation instead of calling the API',
        },
        filter: { type: 'object' },
        include: { type: 'array', items: { type: 'string' } },
        sort: { type: 'array', items: { type: 'string' } },
        page: { type: 'number' },
        per_page: { type: 'number' },
        paginate: { type: 'boolean' },
        max_pages: { type: 'number' },
      },
    },
  },
  {
    name: 'api_write',
    description:
      'Gated raw Productive API write access for documented endpoints. Disabled by default, requires PRODUCTIVE_MCP_ENABLE_API_WRITE=true and confirm=true. Supports dry_run=true.',
    annotations: {
      title: 'Productive API Write',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['POST', 'PATCH', 'PUT', 'DELETE'] },
        path: { type: 'string' },
        body: { type: 'object' },
        confirm: { type: 'boolean' },
        dry_run: { type: 'boolean' },
      },
      required: ['method', 'path', 'confirm'],
    },
  },
  {
    name: 'run_script',
    description:
      'Run a sandboxed JavaScript/TypeScript script for advanced multi-step logic in one call. ' +
      'Globals: productive(resource, action, params), api.read/write, output.*, args, flags; `return` a value for the result. ' +
      'Call `search_docs` (e.g. query="output", "productive") for the scripting API before writing a script. ' +
      'dry_run=true previews mutations. No direct network/filesystem access (API calls run host-side). ' +
      'Disabled by default, requires PRODUCTIVE_MCP_ENABLE_RUN=true.',
    annotations: {
      title: 'Run Script',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'JavaScript/TypeScript source to execute in the sandbox.',
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Positional arguments exposed to the script as `args`.',
        },
        flags: {
          type: 'object',
          description: 'Named values exposed to the script as `flags`.',
        },
        dry_run: {
          type: 'boolean',
          description:
            'Record mutating calls (create/update/delete/...) instead of executing them.',
        },
      },
      required: ['code'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        result: { description: 'The value the script returned (any JSON).' },
        output: {
          type: 'array',
          description: 'Buffered output.* entries, in order.',
          items: {
            type: 'object',
            properties: { type: { type: 'string' }, data: {} },
            required: ['type'],
          },
        },
        _run: {
          type: 'object',
          description: 'Run metadata.',
          properties: {
            apiCalls: { type: 'number' },
            dryRun: { type: 'boolean' },
            outputTruncated: { type: 'boolean' },
            recorded: { type: 'array' },
          },
          required: ['apiCalls', 'dryRun'],
        },
      },
      required: ['result', 'output', '_run'],
    },
  },
  {
    name: 'search_docs',
    description:
      'Discover documentation across everything this server exposes — Productive resources, raw API ' +
      'endpoints, and the run_script scripting API. Call with no query for a table of contents, or a query ' +
      '(e.g. "invoices", "billing", "output") for ranked cross-domain matches: resources/endpoints point at ' +
      'the tool to drill in, run_script sections are returned in full. Good first call when unsure where to look.',
    annotations: {
      title: 'Search Docs',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Optional keyword to search across resources, endpoints, and scripting docs.',
        },
      },
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
