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
import type { HandlerContext, ToolResult } from './handlers/types.js';

import { handleDeals as defaultHandleDeals } from './handlers/deals.js';
import { handlePeople as defaultHandlePeople } from './handlers/people.js';
import { handleProjects as defaultHandleProjects } from './handlers/projects.js';
import { handleSchemaOverview as defaultHandleSchemaOverview } from './handlers/schema.js';
import { handleServices as defaultHandleServices } from './handlers/services.js';
import { handleSummaries as defaultHandleSummaries } from './handlers/summaries.js';
import { handleTasks as defaultHandleTasks } from './handlers/tasks.js';
import { INSTRUCTIONS as DEFAULT_INSTRUCTIONS } from './instructions.js';

/**
 * Optional dependency overrides for readResource.
 * Enables testing without vi.mock().
 */
export interface ResourceDeps {
  buildHandlerContext?: (
    credentials: ProductiveCredentials,
    overrides?: { filter?: Record<string, string> },
  ) => HandlerContext;
  handleSchemaOverview?: () => ToolResult;
  handleSummaries?: (action: string, args: Record<string, unknown>, ctx: HandlerContext) => Promise<ToolResult>;
  handleProjects?: (action: string, args: Record<string, unknown>, ctx: HandlerContext) => Promise<ToolResult>;
  handleTasks?: (action: string, args: Record<string, unknown>, ctx: HandlerContext) => Promise<ToolResult>;
  handlePeople?: (action: string, args: Record<string, unknown>, ctx: HandlerContext, credentials: ProductiveCredentials) => Promise<ToolResult>;
  handleDeals?: (action: string, args: Record<string, unknown>, ctx: HandlerContext) => Promise<ToolResult>;
  handleServices?: (action: string, args: Record<string, unknown>, ctx: HandlerContext) => Promise<ToolResult>;
  instructions?: string;
}

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

/** Build URI patterns with the given handler functions */
function buildUriPatterns(deps: ResolvedDeps) {
  return [
    // Static resources (no credentials needed)
    {
      pattern: /^productive:\/\/schema$/,
      handler: async () => {
        const result = deps.handleSchemaOverview();
        const text = result.content[0] as { text: string };
        return JSON.parse(text.text);
      },
    },
    {
      pattern: /^productive:\/\/instructions$/,
      handler: async () => ({ instructions: deps.instructions }),
    },

    // Dynamic summaries
    {
      pattern: /^productive:\/\/summaries\/my_day$/,
      handler: async (_: RegExpMatchArray, credentials: ProductiveCredentials) => {
        const ctx = deps.buildHandlerContext(credentials);
        const result = await deps.handleSummaries('my_day', {}, ctx);
        return extractJsonFromResult(result);
      },
    },
    {
      pattern: /^productive:\/\/summaries\/team_pulse$/,
      handler: async (_: RegExpMatchArray, credentials: ProductiveCredentials) => {
        const ctx = deps.buildHandlerContext(credentials);
        const result = await deps.handleSummaries('team_pulse', {}, ctx);
        return extractJsonFromResult(result);
      },
    },

    // Project nested resources (before single project to avoid conflict)
    {
      pattern: /^productive:\/\/projects\/([^/]+)\/tasks$/,
      handler: async ([, id]: RegExpMatchArray, credentials: ProductiveCredentials) => {
        const ctx = deps.buildHandlerContext(credentials, { filter: { project_id: id } });
        const result = await deps.handleTasks('list', { project_id: id }, ctx);
        return extractJsonFromResult(result);
      },
    },
    {
      pattern: /^productive:\/\/projects\/([^/]+)\/services$/,
      handler: async ([, id]: RegExpMatchArray, credentials: ProductiveCredentials) => {
        const ctx = deps.buildHandlerContext(credentials, { filter: { project_id: id } });
        const result = await deps.handleServices('list', {}, ctx);
        return extractJsonFromResult(result);
      },
    },

    // Single entity resources
    {
      pattern: /^productive:\/\/projects\/([^/]+)$/,
      handler: async ([, id]: RegExpMatchArray, credentials: ProductiveCredentials) => {
        const ctx = deps.buildHandlerContext(credentials);
        const result = await deps.handleProjects('get', { id }, ctx);
        return extractJsonFromResult(result);
      },
    },
    {
      pattern: /^productive:\/\/tasks\/([^/]+)$/,
      handler: async ([, id]: RegExpMatchArray, credentials: ProductiveCredentials) => {
        const ctx = deps.buildHandlerContext(credentials);
        const result = await deps.handleTasks('get', { id }, ctx);
        return extractJsonFromResult(result);
      },
    },
    {
      pattern: /^productive:\/\/people\/([^/]+)$/,
      handler: async ([, id]: RegExpMatchArray, credentials: ProductiveCredentials) => {
        const ctx = deps.buildHandlerContext(credentials);
        const result = await deps.handlePeople('get', { id }, ctx, credentials);
        return extractJsonFromResult(result);
      },
    },
    {
      pattern: /^productive:\/\/deals\/([^/]+)$/,
      handler: async ([, id]: RegExpMatchArray, credentials: ProductiveCredentials) => {
        const ctx = deps.buildHandlerContext(credentials);
        const result = await deps.handleDeals('get', { id }, ctx);
        return extractJsonFromResult(result);
      },
    },
  ];
}

/** Resolved deps — all fields required (defaults filled in) */
interface ResolvedDeps {
  buildHandlerContext: NonNullable<ResourceDeps['buildHandlerContext']>;
  handleSchemaOverview: NonNullable<ResourceDeps['handleSchemaOverview']>;
  handleSummaries: NonNullable<ResourceDeps['handleSummaries']>;
  handleProjects: NonNullable<ResourceDeps['handleProjects']>;
  handleTasks: NonNullable<ResourceDeps['handleTasks']>;
  handlePeople: NonNullable<ResourceDeps['handlePeople']>;
  handleDeals: NonNullable<ResourceDeps['handleDeals']>;
  handleServices: NonNullable<ResourceDeps['handleServices']>;
  instructions: string;
}

function resolveDeps(deps?: ResourceDeps): ResolvedDeps {
  return {
    buildHandlerContext: deps?.buildHandlerContext ?? buildHandlerContext,
    handleSchemaOverview: deps?.handleSchemaOverview ?? defaultHandleSchemaOverview,
    handleSummaries: deps?.handleSummaries ?? defaultHandleSummaries,
    handleProjects: deps?.handleProjects ?? defaultHandleProjects,
    handleTasks: deps?.handleTasks ?? defaultHandleTasks,
    handlePeople: deps?.handlePeople ?? defaultHandlePeople,
    handleDeals: deps?.handleDeals ?? defaultHandleDeals,
    handleServices: deps?.handleServices ?? defaultHandleServices,
    instructions: deps?.instructions ?? DEFAULT_INSTRUCTIONS,
  };
}

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
  deps?: ResourceDeps,
): Promise<ReadResourceResult> {
  const resolved = resolveDeps(deps);
  const uriPatterns = buildUriPatterns(resolved);
  for (const { pattern, handler } of uriPatterns) {
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
