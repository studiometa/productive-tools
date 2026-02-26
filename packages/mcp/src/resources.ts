/**
 * MCP Resources handlers for Productive MCP Server
 *
 * Exposes Productive data via MCP resources/ capability so clients can browse
 * and read data without tool calls.
 *
 * Static resources (always available):
 *   productive://schema          — full resource schema overview
 *   productive://instructions    — server instructions / SKILL.md content
 *
 * Resource templates (parameterized, require API calls):
 *   productive://projects/{id}            — project details
 *   productive://tasks/{id}               — task details
 *   productive://people/{id}              — person details
 *   productive://deals/{id}               — deal details
 *   productive://projects/{id}/tasks      — tasks for a project
 *   productive://projects/{id}/services   — services for a project
 *
 * Dynamic resources (computed):
 *   productive://summaries/my_day         — personal dashboard
 *   productive://summaries/team_pulse     — team activity
 */

import type { ReadResourceResult as McpReadResourceResult } from '@modelcontextprotocol/sdk/types.js';

import { ProductiveApi } from '@studiometa/productive-api';
import { fromHandlerContext } from '@studiometa/productive-core';

import type { ProductiveCredentials } from './auth.js';
import type { HandlerContext } from './handlers/types.js';

import { handleDeals } from './handlers/deals.js';
import { handlePeople } from './handlers/people.js';
import { handleProjects } from './handlers/projects.js';
import { handleSchemaOverview } from './handlers/schema.js';
import { handleServices } from './handlers/services.js';
import { handleSummaries } from './handlers/summaries.js';
import { handleTasks } from './handlers/tasks.js';
import { INSTRUCTIONS } from './instructions.js';

/** MIME type used for all resource content */
const MIME_TYPE = 'application/json';

/**
 * A single resource content item returned in resources/read responses
 */
export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}

/**
 * Shape of a resources/read response (re-export of SDK type for consumers)
 */
export type ReadResourceResult = McpReadResourceResult;

/**
 * Shape of a static resource descriptor (resources/list)
 */
export interface StaticResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

/**
 * Shape of a resource template descriptor (resources/templates/list)
 */
export interface ResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType: string;
}

// ---------------------------------------------------------------------------
// Static resource definitions
// ---------------------------------------------------------------------------

/**
 * Static resources that are always available without API credentials
 */
export const STATIC_RESOURCES: StaticResource[] = [
  {
    uri: 'productive://schema',
    name: 'Schema',
    description: 'Overview of all Productive.io resources, their actions and filters',
    mimeType: MIME_TYPE,
  },
  {
    uri: 'productive://instructions',
    name: 'Instructions',
    description: 'Server instructions and usage guide for the Productive.io MCP server',
    mimeType: MIME_TYPE,
  },
];

// ---------------------------------------------------------------------------
// Dynamic resource definitions
// ---------------------------------------------------------------------------

/**
 * Dynamic resources that are computed at read time (require credentials)
 */
export const DYNAMIC_RESOURCES: StaticResource[] = [
  {
    uri: 'productive://summaries/my_day',
    name: 'My Day',
    description: "Personal dashboard: open tasks, today's time entries, active timers",
    mimeType: MIME_TYPE,
  },
  {
    uri: 'productive://summaries/team_pulse',
    name: 'Team Pulse',
    description: 'Team-wide time tracking activity for today',
    mimeType: MIME_TYPE,
  },
];

// ---------------------------------------------------------------------------
// Resource template definitions
// ---------------------------------------------------------------------------

/**
 * Resource templates that accept URI parameters (require credentials)
 */
export const RESOURCE_TEMPLATES: ResourceTemplate[] = [
  {
    uriTemplate: 'productive://projects/{id}',
    name: 'Project',
    description: 'Details of a specific project by ID',
    mimeType: MIME_TYPE,
  },
  {
    uriTemplate: 'productive://tasks/{id}',
    name: 'Task',
    description: 'Details of a specific task by ID',
    mimeType: MIME_TYPE,
  },
  {
    uriTemplate: 'productive://people/{id}',
    name: 'Person',
    description: 'Details of a specific person by ID',
    mimeType: MIME_TYPE,
  },
  {
    uriTemplate: 'productive://deals/{id}',
    name: 'Deal',
    description: 'Details of a specific deal or budget by ID',
    mimeType: MIME_TYPE,
  },
  {
    uriTemplate: 'productive://projects/{id}/tasks',
    name: 'Project Tasks',
    description: 'All tasks belonging to a specific project',
    mimeType: MIME_TYPE,
  },
  {
    uriTemplate: 'productive://projects/{id}/services',
    name: 'Project Services',
    description: 'All services belonging to a specific project',
    mimeType: MIME_TYPE,
  },
];

// ---------------------------------------------------------------------------
// URI pattern matching
// ---------------------------------------------------------------------------

/** Route patterns and their handler factories */
const URI_PATTERNS: Array<{
  pattern: RegExp;
  handler: (match: RegExpMatchArray, credentials: ProductiveCredentials) => Promise<unknown>;
}> = [
  // Static resources (no credentials needed)
  {
    pattern: /^productive:\/\/schema$/,
    handler: async () => {
      const result = handleSchemaOverview();
      const text = result.content[0] as { text: string };
      return JSON.parse(text.text);
    },
  },
  {
    pattern: /^productive:\/\/instructions$/,
    handler: async () => ({ instructions: INSTRUCTIONS }),
  },

  // Dynamic summaries
  {
    pattern: /^productive:\/\/summaries\/my_day$/,
    handler: async (_, credentials) => {
      const ctx = buildHandlerContext(credentials);
      const result = await handleSummaries('my_day', {}, ctx);
      return extractJsonFromResult(result);
    },
  },
  {
    pattern: /^productive:\/\/summaries\/team_pulse$/,
    handler: async (_, credentials) => {
      const ctx = buildHandlerContext(credentials);
      const result = await handleSummaries('team_pulse', {}, ctx);
      return extractJsonFromResult(result);
    },
  },

  // Project nested resources (before single project to avoid conflict)
  {
    pattern: /^productive:\/\/projects\/([^/]+)\/tasks$/,
    handler: async ([, id], credentials) => {
      const ctx = buildHandlerContext(credentials, { filter: { project_id: id } });
      const result = await handleTasks('list', { project_id: id }, ctx);
      return extractJsonFromResult(result);
    },
  },
  {
    pattern: /^productive:\/\/projects\/([^/]+)\/services$/,
    handler: async ([, id], credentials) => {
      const ctx = buildHandlerContext(credentials, { filter: { project_id: id } });
      // handleServices uses CommonArgs; project_id is passed via ctx.filter
      const result = await handleServices('list', {}, ctx);
      return extractJsonFromResult(result);
    },
  },

  // Single entity resources
  {
    pattern: /^productive:\/\/projects\/([^/]+)$/,
    handler: async ([, id], credentials) => {
      const ctx = buildHandlerContext(credentials);
      const result = await handleProjects('get', { id }, ctx);
      return extractJsonFromResult(result);
    },
  },
  {
    pattern: /^productive:\/\/tasks\/([^/]+)$/,
    handler: async ([, id], credentials) => {
      const ctx = buildHandlerContext(credentials);
      const result = await handleTasks('get', { id }, ctx);
      return extractJsonFromResult(result);
    },
  },
  {
    pattern: /^productive:\/\/people\/([^/]+)$/,
    handler: async ([, id], credentials) => {
      const ctx = buildHandlerContext(credentials);
      const result = await handlePeople('get', { id }, ctx, credentials);
      return extractJsonFromResult(result);
    },
  },
  {
    pattern: /^productive:\/\/deals\/([^/]+)$/,
    handler: async ([, id], credentials) => {
      const ctx = buildHandlerContext(credentials);
      const result = await handleDeals('get', { id }, ctx);
      return extractJsonFromResult(result);
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a HandlerContext from credentials, with optional filter overrides.
 */
function buildHandlerContext(
  credentials: ProductiveCredentials,
  overrides: { filter?: Record<string, string> } = {},
): HandlerContext {
  const api = new ProductiveApi({
    config: {
      apiToken: credentials.apiToken,
      organizationId: credentials.organizationId,
      userId: credentials.userId,
      baseUrl: process.env.PRODUCTIVE_BASE_URL,
    },
  });

  const execCtx = fromHandlerContext({ api }, { userId: credentials.userId });

  return {
    formatOptions: { compact: false },
    filter: overrides.filter,
    perPage: 50,
    includeHints: false,
    includeSuggestions: false,
    executor: () => execCtx,
  };
}

/**
 * Extract the parsed JSON data from a ToolResult.
 * Throws if the result is an error or not parseable.
 */
function extractJsonFromResult(result: { content: unknown[]; isError?: boolean }): unknown {
  if (result.isError) {
    const text = (result.content[0] as { text: string }).text;
    throw new Error(text);
  }
  const text = (result.content[0] as { text: string }).text;
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * List all static and dynamic resources (no credentials needed for static).
 */
export function listResources(): StaticResource[] {
  return [...STATIC_RESOURCES, ...DYNAMIC_RESOURCES];
}

/**
 * List all resource templates.
 */
export function listResourceTemplates(): ResourceTemplate[] {
  return RESOURCE_TEMPLATES;
}

/**
 * Read a resource by URI.
 *
 * Routes the URI to the appropriate handler. Throws on unknown URI.
 */
export async function readResource(
  uri: string,
  credentials: ProductiveCredentials,
): Promise<ReadResourceResult> {
  for (const { pattern, handler } of URI_PATTERNS) {
    const match = uri.match(pattern);
    if (match) {
      const data = await handler(match, credentials);
      return {
        contents: [
          {
            uri,
            mimeType: MIME_TYPE,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  }

  throw new Error(
    `Unknown resource URI: ${uri}. ` +
      `Available static resources: ${STATIC_RESOURCES.map((r) => r.uri).join(', ')}. ` +
      `Available dynamic resources: ${DYNAMIC_RESOURCES.map((r) => r.uri).join(', ')}. ` +
      `Resource templates: ${RESOURCE_TEMPLATES.map((t) => t.uriTemplate).join(', ')}.`,
  );
}
