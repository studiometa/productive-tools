/**
 * Tool execution handlers for Productive MCP server
 * These are shared between stdio and HTTP transports
 *
 * Consolidated tools reduce token overhead by grouping related operations:
 * - productive_projects: list, get
 * - productive_time: list, get, create, update, delete
 * - productive_tasks: list, get
 * - productive_services: list
 * - productive_people: list, get, me
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
 * Common args interface for consolidated tools
 */
interface ConsolidatedArgs {
  action: string;
  id?: string;
  filter?: Record<string, unknown>;
  page?: number;
  per_page?: number;
  compact?: boolean;
  [key: string]: unknown;
}

/**
 * Execute a tool with the given credentials and arguments
 *
 * @param name - Tool name
 * @param args - Tool arguments
 * @param credentials - Productive API credentials
 * @returns Tool execution result
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

  const { action, id, filter, page, per_page, compact, ...restArgs } = args as ConsolidatedArgs;
  const formatOptions: McpFormatOptions = { compact };
  const stringFilter = toStringFilter(filter);

  // Apply default page size
  const perPage = per_page ?? DEFAULT_PER_PAGE;

  try {
    switch (name) {
      // ========================================================================
      // Projects
      // ========================================================================
      case 'productive_projects': {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getProject(id);
          return jsonResult(formatProject(result.data, formatOptions));
        }
        // Default: list
        const result = await api.getProjects({ filter: stringFilter, page, perPage });
        return jsonResult(
          formatListResponse(result.data, formatProject, result.meta, formatOptions)
        );
      }

      // ========================================================================
      // Time Entries
      // ========================================================================
      case 'productive_time': {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getTimeEntry(id);
          return jsonResult(formatTimeEntry(result.data, formatOptions));
        }

        if (action === 'create') {
          const { person_id, service_id, time, date, note, task_id } = restArgs as {
            person_id?: string;
            service_id?: string;
            time?: number;
            date?: string;
            note?: string;
            task_id?: string;
          };
          if (!person_id || !service_id || !time || !date) {
            return errorResult('person_id, service_id, time, and date are required for create');
          }
          // Note: task_id is not directly supported by createTimeEntry API
          // It would need to be set via relationships in a more complex request
          const createParams: Parameters<typeof api.createTimeEntry>[0] = {
            person_id,
            service_id,
            time,
            date,
            note,
          };
          const result = await api.createTimeEntry(createParams);
          const response: Record<string, unknown> = {
            success: true,
            ...formatTimeEntry(result.data, formatOptions),
          };
          if (task_id) {
            response.warning = 'task_id was provided but is not currently supported for create';
          }
          return jsonResult(response);
        }

        if (action === 'update') {
          if (!id) return errorResult('id is required for update action');
          const { time, date, note } = restArgs as {
            time?: number;
            date?: string;
            note?: string;
          };
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

        // Default: list
        const result = await api.getTimeEntries({ filter: stringFilter, page, perPage });
        return jsonResult(
          formatListResponse(result.data, formatTimeEntry, result.meta, formatOptions)
        );
      }

      // ========================================================================
      // Tasks
      // ========================================================================
      case 'productive_tasks': {
        // Always include project and company for context
        const include = ['project', 'project.company'];

        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getTask(id, { include });
          return jsonResult(
            formatTask(result.data, { ...formatOptions, included: result.included })
          );
        }

        // Default: list
        const result = await api.getTasks({ filter: stringFilter, page, perPage, include });
        return jsonResult(
          formatListResponse(result.data, formatTask, result.meta, {
            ...formatOptions,
            included: result.included,
          })
        );
      }

      // ========================================================================
      // Services
      // ========================================================================
      case 'productive_services': {
        // Only list action
        const result = await api.getServices({ filter: stringFilter, page, perPage });
        return jsonResult(
          formatListResponse(result.data, formatService, result.meta, formatOptions)
        );
      }

      // ========================================================================
      // People
      // ========================================================================
      case 'productive_people': {
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

        // Default: list
        const result = await api.getPeople({ filter: stringFilter, page, perPage });
        return jsonResult(
          formatListResponse(result.data, formatPerson, result.meta, formatOptions)
        );
      }

      // ========================================================================
      // Legacy tool names (for backward compatibility during transition)
      // ========================================================================
      case 'productive_list_projects': {
        const result = await api.getProjects({ filter: stringFilter, page, perPage });
        return jsonResult(formatListResponse(result.data, formatProject, result.meta, formatOptions));
      }

      case 'productive_get_project': {
        const projectId = (args as { id: string }).id;
        if (!projectId) return errorResult('id is required');
        const result = await api.getProject(projectId);
        return jsonResult(formatProject(result.data, formatOptions));
      }

      case 'productive_list_time_entries': {
        const result = await api.getTimeEntries({ filter: stringFilter, page, perPage });
        return jsonResult(formatListResponse(result.data, formatTimeEntry, result.meta, formatOptions));
      }

      case 'productive_get_time_entry': {
        const entryId = (args as { id: string }).id;
        if (!entryId) return errorResult('id is required');
        const result = await api.getTimeEntry(entryId);
        return jsonResult(formatTimeEntry(result.data, formatOptions));
      }

      case 'productive_create_time_entry': {
        const createArgs = args as {
          person_id: string;
          service_id: string;
          time: number;
          date: string;
          note?: string;
        };
        const result = await api.createTimeEntry(createArgs);
        return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
      }

      case 'productive_update_time_entry': {
        const { id: entryId, ...data } = args as { id: string } & Record<string, unknown>;
        if (!entryId) return errorResult('id is required');
        const updateData: Parameters<typeof api.updateTimeEntry>[1] = {};
        if (data.time !== undefined) updateData.time = data.time as number;
        if (data.date !== undefined) updateData.date = data.date as string;
        if (data.note !== undefined) updateData.note = data.note as string;
        // Note: service_id and task_id cannot be updated via PATCH (API limitation)
        const result = await api.updateTimeEntry(entryId, updateData);
        return jsonResult({ success: true, ...formatTimeEntry(result.data, formatOptions) });
      }

      case 'productive_delete_time_entry': {
        const entryId = (args as { id: string }).id;
        if (!entryId) return errorResult('id is required');
        await api.deleteTimeEntry(entryId);
        return jsonResult({ success: true, message: 'Time entry deleted' });
      }

      case 'productive_list_tasks': {
        const params = { filter: stringFilter, page, perPage, include: ['project', 'project.company'] };
        const result = await api.getTasks(params);
        return jsonResult(
          formatListResponse(result.data, formatTask, result.meta, {
            ...formatOptions,
            included: result.included,
          })
        );
      }

      case 'productive_get_task': {
        const taskId = (args as { id: string }).id;
        if (!taskId) return errorResult('id is required');
        const result = await api.getTask(taskId, { include: ['project', 'project.company'] });
        return jsonResult(formatTask(result.data, { ...formatOptions, included: result.included }));
      }

      case 'productive_list_services': {
        const result = await api.getServices({ filter: stringFilter, page, perPage });
        return jsonResult(formatListResponse(result.data, formatService, result.meta, formatOptions));
      }

      case 'productive_list_people': {
        const result = await api.getPeople({ filter: stringFilter, page, perPage });
        return jsonResult(formatListResponse(result.data, formatPerson, result.meta, formatOptions));
      }

      case 'productive_get_person': {
        const personId = (args as { id: string }).id;
        if (!personId) return errorResult('id is required');
        const result = await api.getPerson(personId);
        return jsonResult(formatPerson(result.data, formatOptions));
      }

      case 'productive_get_current_user': {
        if (credentials.userId) {
          const result = await api.getPerson(credentials.userId);
          return jsonResult(formatPerson(result.data, formatOptions));
        }
        return jsonResult({
          message: 'User ID not configured. Set userId in credentials to use this tool.',
          organizationId: credentials.organizationId,
        });
      }

      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResult(message);
  }
}
