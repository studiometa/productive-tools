/**
 * Tool execution handlers for Productive MCP server
 * These are shared between stdio and HTTP transports
 *
 * Single consolidated tool for minimal token overhead:
 * - productive: resource + action based API
 */

import { ProductiveApi } from '@studiometa/productive-cli';

import type { ProductiveCredentials } from '../auth.js';
import type { McpFormatOptions } from '../formatters.js';
import type { ToolResult, HandlerContext } from './types.js';

import { handleBookings } from './bookings.js';
import { handleComments } from './comments.js';
import { handleCompanies } from './companies.js';
import { handleDeals } from './deals.js';
import { handleHelp, handleHelpOverview } from './help.js';
import { handlePeople } from './people.js';
// Resource handlers
import { handleProjects } from './projects.js';
import { handleReports } from './reports.js';
import { handleServices } from './services.js';
import { handleTasks } from './tasks.js';
import { handleTime } from './time.js';
import { handleTimers } from './timers.js';
import { toStringFilter, errorResult } from './utils.js';

// Re-export types
export type { ToolResult } from './types.js';

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
  // Timer fields
  time_entry_id?: string;
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
    token: credentials.apiToken,
    'org-id': credentials.organizationId,
    'user-id': credentials.userId,
  } as Record<string, string>);

  // Handle the single consolidated tool
  if (name !== 'productive') {
    return errorResult(`Unknown tool: ${name}`);
  }

  const { resource, action, filter, page, per_page, compact, include, query, ...restArgs } =
    args as unknown as ProductiveArgs;

  // Default compact to false for 'get' action (single resource), true for 'list'
  const isCompact = compact ?? action !== 'get';
  const formatOptions: McpFormatOptions = { compact: isCompact };
  let stringFilter = toStringFilter(filter);
  const perPage = per_page ?? DEFAULT_PER_PAGE;

  // Add query to filter if provided (for text search)
  if (query) {
    stringFilter = { ...stringFilter, query };
  }

  // Build handler context
  const ctx: HandlerContext = {
    api,
    formatOptions,
    filter: stringFilter,
    page,
    perPage,
    include,
  };

  try {
    // Handle help action first (doesn't need API)
    if (action === 'help') {
      return resource ? handleHelp(resource) : handleHelpOverview();
    }

    // Route to appropriate resource handler
    switch (resource) {
      case 'projects':
        return await handleProjects(action, restArgs, ctx);

      case 'time':
        return await handleTime(action, restArgs, ctx);

      case 'tasks':
        return await handleTasks(action, restArgs, ctx);

      case 'services':
        return await handleServices(action, restArgs, ctx);

      case 'people':
        return await handlePeople(action, restArgs, ctx, credentials);

      case 'companies':
        return await handleCompanies(action, restArgs, ctx);

      case 'comments':
        return await handleComments(action, restArgs, ctx);

      case 'timers':
        return await handleTimers(action, restArgs, ctx);

      case 'deals':
        return await handleDeals(action, restArgs, ctx);

      case 'bookings':
        return await handleBookings(action, restArgs, ctx);

      case 'reports':
        return await handleReports(action, restArgs, ctx);

      default:
        return errorResult(`Unknown resource: ${resource}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(message);
  }
}
