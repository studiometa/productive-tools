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

import { ErrorMessages, isUserInputError } from '../errors.js';
import { handleAttachments } from './attachments.js';
import { handleBookings } from './bookings.js';
import { handleBudgets } from './budgets.js';
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
import { handleServices } from './services.js';
import { handleTasks } from './tasks.js';
import { handleTime } from './time.js';
import { handleTimers } from './timers.js';
import { errorResult, formatError, inputErrorResult, toStringFilter } from './utils.js';

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
}

/**
 * Execute a tool with the given credentials and arguments
 */
export async function executeToolWithCredentials(
  name: string,
  args: Record<string, unknown>,
  credentials: ProductiveCredentials,
): Promise<ToolResult> {
  // Initialize API client with provided credentials
  const api = new ProductiveApi({
    config: {
      apiToken: credentials.apiToken,
      organizationId: credentials.organizationId,
      userId: credentials.userId,
    },
  });

  // Handle the single consolidated tool
  if (name !== 'productive') {
    return errorResult(`Unknown tool: ${name}`);
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
    no_hints,
    type,
    ...restArgs
  } = args as unknown as ProductiveArgs & { no_hints?: boolean; type?: ResolvableResourceType };

  // Default compact to false for 'get' action (single resource), true for 'list'
  const isCompact = compact ?? action !== 'get';
  const formatOptions: McpFormatOptions = { compact: isCompact };
  let stringFilter = toStringFilter(filter);
  const perPage = per_page ?? DEFAULT_PER_PAGE;

  // Add query to filter if provided (for text search)
  if (query) {
    stringFilter = { ...stringFilter, query };
  }

  // Hints are included by default for 'get' action, disabled for 'list' or when compact
  // Can be explicitly disabled with no_hints: true
  const includeHints = no_hints !== true && action === 'get' && !isCompact;

  // Build handler context — api is not exposed directly.
  // Handlers access executors via ctx.executor() which creates an ExecutorContext.
  const execCtx = fromHandlerContext({ api });
  const ctx: HandlerContext = {
    formatOptions,
    filter: stringFilter,
    page,
    perPage,
    include,
    includeHints,
    executor: () => execCtx,
  };

  try {
    // Handle help action first (doesn't need API)
    if (action === 'help') {
      return resource ? handleHelp(resource) : handleHelpOverview();
    }

    // Route to appropriate resource handler
    // Note: query and type are passed explicitly for resolve action support
    const resolveArgs = { query, type };
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

      case 'budgets':
        return await handleBudgets(action, restArgs, ctx);
      case 'pages':
        return await handlePages(action, restArgs, ctx);

      case 'discussions':
        return await handleDiscussions(action, restArgs, ctx);

      case 'reports':
        return await handleReports(action, restArgs, ctx);

      default:
        return inputErrorResult(ErrorMessages.unknownResource(resource, VALID_RESOURCES));
    }
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
