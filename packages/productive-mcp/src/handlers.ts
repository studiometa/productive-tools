/**
 * Tool execution handlers for Productive MCP server
 * These are shared between stdio and HTTP transports
 *
 * Single consolidated tool for minimal token overhead:
 * - productive: resource + action based API
 */

import { ProductiveApi } from '@studiometa/productive-cli';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ProductiveCredentials } from './auth.js';
import {
  formatTimeEntry,
  formatTask,
  formatProject,
  formatPerson,
  formatService,
  formatListResponse,
  type McpFormatOptions,
} from './formatters.js';

export type ToolResult = CallToolResult;

/** Default page size for MCP (smaller than CLI to reduce token usage) */
const DEFAULT_PER_PAGE = 20;

/**
 * Helper to create a successful JSON response
 */
function jsonResult(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Helper to create an error response
 */
function errorResult(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * Convert unknown filter to string filter for API
 */
function toStringFilter(filter?: Record<string, unknown>): Record<string, string> | undefined {
  if (!filter) return undefined;
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null) {
      result[key] = String(value);
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Args interface for the consolidated tool
 */
interface ProductiveArgs {
  resource: 'projects' | 'time' | 'tasks' | 'services' | 'people';
  action: 'list' | 'get' | 'create' | 'update' | 'delete' | 'me';
  id?: string;
  filter?: Record<string, unknown>;
  page?: number;
  per_page?: number;
  compact?: boolean;
  // Time entry fields
  person_id?: string;
  service_id?: string;
  task_id?: string;
  time?: number;
  date?: string;
  note?: string;
}

/**
 * Execute a tool with the given credentials and arguments
 */
export async function executeToolWithCredentials(
  name: string,
  args: Record<string, unknown>,
  credentials: ProductiveCredentials
): Promise<ToolResult> {
  // Initialize API client with provided credentials
  const api = new ProductiveApi({
    token: credentials.apiToken,
    'org-id': credentials.organizationId,
    'user-id': credentials.userId,
  } as Record<string, string>);

  // Handle the single consolidated tool
  if (name === 'productive') {
    const {
      resource,
      action,
      id,
      filter,
      page,
      per_page,
      compact = true,
      person_id,
      service_id,
      task_id,
      time,
      date,
      note,
    } = args as unknown as ProductiveArgs;

    const formatOptions: McpFormatOptions = { compact };
    const stringFilter = toStringFilter(filter);
    const perPage = per_page ?? DEFAULT_PER_PAGE;

    try {
      // ========================================================================
      // Projects
      // ========================================================================
      if (resource === 'projects') {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getProject(id);
          return jsonResult(formatProject(result.data, formatOptions));
        }
        if (action === 'list') {
          const result = await api.getProjects({ filter: stringFilter, page, perPage });
          return jsonResult(
            formatListResponse(result.data, formatProject, result.meta, formatOptions)
          );
        }
        return errorResult(`Invalid action "${action}" for projects. Use: list, get`);
      }

      // ========================================================================
      // Time Entries
      // ========================================================================
      if (resource === 'time') {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getTimeEntry(id);
          return jsonResult(formatTimeEntry(result.data, formatOptions));
        }

        if (action === 'create') {
          if (!person_id || !service_id || !time || !date) {
            return errorResult('person_id, service_id, time, and date are required for create');
          }
          const result = await api.createTimeEntry({
            person_id,
            service_id,
            time,
            date,
            note,
            task_id,
          });
          return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
        }

        if (action === 'update') {
          if (!id) return errorResult('id is required for update action');
          const updateData: Parameters<typeof api.updateTimeEntry>[1] = {};
          if (time !== undefined) updateData.time = time;
          if (date !== undefined) updateData.date = date;
          if (note !== undefined) updateData.note = note;
          const result = await api.updateTimeEntry(id, updateData);
          return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
        }

        if (action === 'delete') {
          if (!id) return errorResult('id is required for delete action');
          await api.deleteTimeEntry(id);
          return jsonResult({ success: true, message: 'Time entry deleted' });
        }

        if (action === 'list') {
          const result = await api.getTimeEntries({ filter: stringFilter, page, perPage });
          return jsonResult(
            formatListResponse(result.data, formatTimeEntry, result.meta, formatOptions)
          );
        }

        return errorResult(`Invalid action "${action}" for time. Use: list, get, create, update, delete`);
      }

      // ========================================================================
      // Tasks
      // ========================================================================
      if (resource === 'tasks') {
        const include = ['project', 'project.company'];

        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getTask(id, { include });
          return jsonResult(
            formatTask(result.data, { ...formatOptions, included: result.included })
          );
        }

        if (action === 'list') {
          const result = await api.getTasks({ filter: stringFilter, page, perPage, include });
          return jsonResult(
            formatListResponse(result.data, formatTask, result.meta, {
              ...formatOptions,
              included: result.included,
            })
          );
        }

        return errorResult(`Invalid action "${action}" for tasks. Use: list, get`);
      }

      // ========================================================================
      // Services
      // ========================================================================
      if (resource === 'services') {
        if (action === 'list') {
          const result = await api.getServices({ filter: stringFilter, page, perPage });
          return jsonResult(
            formatListResponse(result.data, formatService, result.meta, formatOptions)
          );
        }

        return errorResult(`Invalid action "${action}" for services. Use: list`);
      }

      // ========================================================================
      // People
      // ========================================================================
      if (resource === 'people') {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getPerson(id);
          return jsonResult(formatPerson(result.data, formatOptions));
        }

        if (action === 'me') {
          if (credentials.userId) {
            const result = await api.getPerson(credentials.userId);
            return jsonResult(formatPerson(result.data, formatOptions));
          }
          return jsonResult({
            message: 'User ID not configured. Set userId in credentials to use this action.',
            organizationId: credentials.organizationId,
          });
        }

        if (action === 'list') {
          const result = await api.getPeople({ filter: stringFilter, page, perPage });
          return jsonResult(
            formatListResponse(result.data, formatPerson, result.meta, formatOptions)
          );
        }

        return errorResult(`Invalid action "${action}" for people. Use: list, get, me`);
      }

      return errorResult(`Unknown resource: ${resource}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(message);
    }
  }

  return errorResult(`Unknown tool: ${name}`);
}
