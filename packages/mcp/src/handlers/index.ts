/**
 * Tool execution handlers for Productive MCP server
 * These are shared between stdio and HTTP transports
 *
 * Single consolidated tool for minimal token overhead:
 * - productive: resource + action based API
 */

import { ProductiveApi } from '@studiometa/productive-api';
import { fromHandlerContext, RESOURCES } from '@studiometa/productive-core';

import type { ProductiveCredentials } from '../auth.js';
import type { McpFormatOptions } from '../formatters.js';
import type { HandlerContext, ToolResult } from './types.js';

import { ErrorMessages, UserInputError, isUserInputError } from '../errors.js';
import { handleAttachments } from './attachments.js';
import { handleBatch } from './batch.js';
import { handleBookings } from './bookings.js';
import { handleComments } from './comments.js';
import { handleCompanies } from './companies.js';
import { handleDeals } from './deals.js';
import { handleDiscussions } from './discussions.js';
import { handleHelp, handleHelpOverview } from './help.js';
import { handlePages } from './pages.js';
import { handlePeople } from './people.js';
// Resource handlers
import { handleProjects } from './projects.js';
import { handleReports } from './reports.js';
import { type ResolvableResourceType } from './resolve.js';
import { handleSchema, handleSchemaOverview } from './schema.js';
import { handleSearch } from './search.js';
import { handleServices } from './services.js';
import { handleSummaries } from './summaries.js';
import { handleTasks } from './tasks.js';
import { handleTime } from './time.js';
import { handleTimers } from './timers.js';
import { errorResult, formatError, inputErrorResult, toStringFilter } from './utils.js';
import { VALID_INCLUDES, validateIncludes } from './valid-includes.js';
import { handleWorkflows } from './workflows.js';

// Re-export types
export type { ToolResult } from './types.js';

/** Valid resources for the productive tool (derived from core constants) */
const VALID_RESOURCES = [...RESOURCES];

/** Default page size for MCP (smaller than CLI to reduce token usage) */
const DEFAULT_PER_PAGE = 20;

/**
 * Args interface for the consolidated tool
 */
interface ProductiveArgs {
  resource: string;
  action: string;
  id?: string;
  filter?: Record<string, unknown>;
  page?: number;
  per_page?: number;
  compact?: boolean;
  include?: string[];
  query?: string;
  resources?: string[];
  // Common fields
  person_id?: string;
  service_id?: string;
  task_id?: string;
  company_id?: string;
  time?: number;
  date?: string;
  note?: string;
  // Task fields
  title?: string;
  project_id?: string;
  task_list_id?: string;
  description?: string;
  assignee_id?: string;
  // Company fields
  name?: string;
  // Comment fields
  body?: string;
  deal_id?: string;
  // Attachment fields
  comment_id?: string;
  // Timer fields
  time_entry_id?: string;
  // Page fields
  parent_page_id?: string;
  page_id?: string;
  // Booking fields
  started_on?: string;
  ended_on?: string;
  event_id?: string;
  // Report fields
  report_type?: string;
  group?: string;
  from?: string;
  to?: string;
  status?: string;
  // Batch fields
  operations?: Array<Record<string, unknown>>;
  // Workflow fields
  entries?: Array<Record<string, unknown>>;
  comment?: string;
  stop_timer?: boolean;
  week_start?: string;
}

/**
 * Route to the appropriate resource handler.
 * Extracted from executeToolWithCredentials to keep cyclomatic complexity manageable.
 */
async function routeToHandler(
  resource: string,
  action: string,
  restArgs: Record<string, unknown>,
  resolveArgs: { query?: string; type?: ResolvableResourceType },
  ctx: HandlerContext,
  credentials: ProductiveCredentials,
): Promise<ToolResult> {
  switch (resource) {
    case 'projects':
      return await handleProjects(action, { ...restArgs, ...resolveArgs }, ctx);

    case 'time':
      return await handleTime(action, { ...restArgs, ...resolveArgs }, ctx);

    case 'tasks':
      return await handleTasks(action, { ...restArgs, ...resolveArgs }, ctx);

    case 'services':
      return await handleServices(action, restArgs, ctx);

    case 'people':
      return await handlePeople(action, { ...restArgs, ...resolveArgs }, ctx, credentials);

    case 'companies':
      return await handleCompanies(action, { ...restArgs, ...resolveArgs }, ctx);

    case 'comments':
      return await handleComments(action, restArgs, ctx);

    case 'attachments':
      return await handleAttachments(action, restArgs, ctx);

    case 'timers':
      return await handleTimers(action, restArgs, ctx);

    case 'deals':
      return await handleDeals(action, { ...restArgs, ...resolveArgs }, ctx);

    case 'bookings':
      return await handleBookings(action, restArgs, ctx);

    case 'pages':
      return await handlePages(action, restArgs, ctx);

    case 'discussions':
      return await handleDiscussions(action, restArgs, ctx);

    case 'reports':
      return await handleReports(action, restArgs, ctx);

    case 'summaries':
      return await handleSummaries(action, restArgs, ctx);

    case 'workflows':
      return await handleWorkflows(action, restArgs, ctx);

    case 'budgets':
      return inputErrorResult(
        new UserInputError(
          'The "budgets" resource has been removed. Budgets are deals with type=2.',
          [
            'Use resource="deals" with filter[type]="2" to list only budgets',
            'To create a budget: resource="deals" action="create" with budget=true',
            'Use action="help" resource="deals" for full documentation',
          ],
        ),
      );

    case 'docs':
      return inputErrorResult(
        new UserInputError('Unknown resource "docs". Did you mean "pages"?', [
          'Use resource="pages" to access Productive pages/documents',
          'Use action="list" to list all pages',
          'Use action="help" resource="pages" for full documentation',
        ]),
      );

    default:
      return inputErrorResult(ErrorMessages.unknownResource(resource, VALID_RESOURCES));
  }
}

/**
 * Execute a tool with the given credentials and arguments
 */
export async function executeToolWithCredentials(
  name: string,
  args: Record<string, unknown>,
  credentials: ProductiveCredentials,
): Promise<ToolResult> {
  // Handle the single consolidated tool
  if (name !== 'productive') {
    return errorResult(`Unknown tool: ${name}`);
  }

  // Handle batch resource BEFORE initializing API client
  // Batch delegates back to executeToolWithCredentials for each operation
  const typedArgs = args as unknown as ProductiveArgs;
  if (typedArgs.resource === 'batch') {
    return handleBatch(typedArgs.operations, credentials, executeToolWithCredentials);
  }

  // Detect common mistake: passing "params" instead of "filter"
  if ((args as Record<string, unknown>).params !== undefined) {
    return inputErrorResult(
      new UserInputError('Unknown field "params". Use "filter" instead.', [
        'Example: { "filter": { "assignee_id": "me" } }',
        'The MCP tool uses "filter" for query parameters, not "params"',
      ]),
    );
  }

  const {
    resource,
    action,
    filter,
    page,
    per_page,
    compact,
    include,
    query,
    resources,
    no_hints,
    type,
    ...restArgs
  } = typedArgs as ProductiveArgs & { no_hints?: boolean; type?: ResolvableResourceType };

  // Handle cross-resource search BEFORE API client initialization
  // (search delegates to executeToolWithCredentials for each resource)
  if (resource === 'search') {
    return await handleSearch(query, resources, credentials, executeToolWithCredentials);
  }

  // Initialize API client with provided credentials
  const api = new ProductiveApi({
    config: {
      apiToken: credentials.apiToken,
      organizationId: credentials.organizationId,
      userId: credentials.userId,
      baseUrl: process.env.PRODUCTIVE_BASE_URL,
    },
  });

  // Default compact to false for 'get' action (single resource), true for 'list'
  const isCompact = compact ?? action !== 'get';
  const formatOptions: McpFormatOptions = { compact: isCompact };
  let stringFilter = toStringFilter(filter);
  const perPage = per_page ?? DEFAULT_PER_PAGE;

  // Add query to filter if provided (for text search)
  if (query) {
    stringFilter = { ...stringFilter, query };
  }

  // Hints are included for 'get' actions (not compact), suggestions for any action.
  // Both are disabled with no_hints: true.
  const includeHints = no_hints !== true && action === 'get' && !isCompact;
  const includeSuggestions = no_hints !== true;

  // Validate include values against known-valid includes for this resource.
  // Do this before building the handler context so we can return early.
  if (include && include.length > 0) {
    const includeValidation = validateIncludes(resource, include);
    if (includeValidation && includeValidation.invalid.length > 0) {
      const { invalid, valid, suggestions } = includeValidation;
      const hintLines: string[] = [
        `Invalid include value${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`,
        `Valid includes for ${resource}: ${(VALID_INCLUDES[resource] ?? []).join(', ')}`,
      ];
      for (const [value, suggestion] of Object.entries(suggestions)) {
        hintLines.push(`"${value}": ${suggestion}`);
      }
      if (valid.length > 0) {
        hintLines.push(
          `The following includes are valid and will be used if you remove the invalid ones: ${valid.join(', ')}`,
        );
      }
      return inputErrorResult(
        new UserInputError(
          `Invalid include value${invalid.length > 1 ? 's' : ''} for resource "${resource}": ${invalid.join(', ')}`,
          hintLines,
        ),
      );
    }
  }

  // Build handler context — api is not exposed directly.
  // Handlers access executors via ctx.executor() which creates an ExecutorContext.
  const execCtx = fromHandlerContext({ api }, { userId: credentials.userId });
  const ctx: HandlerContext = {
    formatOptions,
    filter: stringFilter,
    page,
    perPage,
    include,
    includeHints,
    includeSuggestions,
    executor: () => execCtx,
  };

  try {
    // Intercept common wrong action patterns and return helpful guidance

    // action="search" on a specific resource — agents should use action="list" with query, or resource="search"
    if (action === 'search' && resource !== 'search') {
      return inputErrorResult(
        new UserInputError(
          `action="search" is not supported on resource="${resource}". Use action="list" with a query parameter for text filtering, or use resource="search" for cross-resource search.`,
          [
            `Use resource="${resource}" action="list" with query="<your search terms>" to filter ${resource}`,
            'Use resource="search" action="run" with query="<your search terms>" to search across all resources',
            `Use action="help" resource="${resource}" to see all supported actions and filters`,
          ],
        ),
      );
    }

    // action starts with "get_" — agents using snake_case function-style naming
    if (action.startsWith('get_')) {
      const suggestedResource = action.replace(/^get_/, '').replace(/_/g, ' ');
      return inputErrorResult(
        new UserInputError(
          `action="${action}" is not valid. Actions use simple verbs like "list", "get", "create", not function-style names.`,
          [
            `To retrieve a single item, use action="get" with an id parameter`,
            `To retrieve multiple items, use action="list" (e.g. resource="${resource || suggestedResource}" action="list")`,
            `Use action="help" resource="${resource || 'tasks'}" to see all supported actions for a resource`,
          ],
        ),
      );
    }

    // Handle help action first (doesn't need API)
    // Exception: summaries has its own help handler
    if (action === 'help' && resource !== 'summaries') {
      return resource ? handleHelp(resource) : handleHelpOverview();
    }

    // Handle schema action (doesn't need API)
    if (action === 'schema') {
      return resource ? handleSchema(resource) : handleSchemaOverview();
    }

    // Route to appropriate resource handler
    const resolveArgs = { query, type };
    return await routeToHandler(resource, action, restArgs, resolveArgs, ctx, credentials);
  } catch (error) {
    // Handle UserInputError with formatted hints
    if (isUserInputError(error)) {
      return formatError(error);
    }

    // Handle API errors with status codes
    const message = error instanceof Error ? error.message : String(error);
    const statusMatch = message.match(/(\d{3})/);
    if (statusMatch) {
      const statusCode = Number.parseInt(statusMatch[1], 10);
      return inputErrorResult(ErrorMessages.apiError(statusCode, message));
    }

    return errorResult(message);
  }
}
