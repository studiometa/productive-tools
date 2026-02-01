/**
 * Tool execution handlers for Productive MCP server
 * These are shared between stdio and HTTP transports
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
} from './formatters.js';

export type ToolResult = CallToolResult;

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
    apiToken: credentials.apiToken,
    organizationId: credentials.organizationId,
  } as Record<string, string>);

  try {
    switch (name) {
      case 'productive_list_projects': {
        const result = await api.getProjects(args as Parameters<typeof api.getProjects>[0]);
        return jsonResult(formatListResponse(result.data, formatProject, result.meta));
      }

      case 'productive_get_project': {
        const result = await api.getProject((args as { id: string }).id);
        return jsonResult(formatProject(result.data));
      }

      case 'productive_list_time_entries': {
        const result = await api.getTimeEntries(args as Parameters<typeof api.getTimeEntries>[0]);
        return jsonResult(formatListResponse(result.data, formatTimeEntry, result.meta));
      }

      case 'productive_get_time_entry': {
        const result = await api.getTimeEntry((args as { id: string }).id);
        return jsonResult(formatTimeEntry(result.data));
      }

      case 'productive_create_time_entry': {
        const result = await api.createTimeEntry(
          args as Parameters<typeof api.createTimeEntry>[0]
        );
        return jsonResult({
          success: true,
          ...formatTimeEntry(result.data),
        });
      }

      case 'productive_update_time_entry': {
        const { id, ...data } = args as { id: string } & Record<string, unknown>;
        const result = await api.updateTimeEntry(id, data as Parameters<typeof api.updateTimeEntry>[1]);
        return jsonResult({
          success: true,
          ...formatTimeEntry(result.data),
        });
      }

      case 'productive_delete_time_entry': {
        await api.deleteTimeEntry((args as { id: string }).id);
        return jsonResult({ success: true, message: 'Time entry deleted' });
      }

      case 'productive_list_tasks': {
        const params = args as Parameters<typeof api.getTasks>[0] || {};
        // Always include project and company for context
        params.include = ['project', 'project.company'];
        const result = await api.getTasks(params);
        return jsonResult(formatListResponse(
          result.data,
          formatTask,
          result.meta,
          result.included
        ));
      }

      case 'productive_get_task': {
        const result = await api.getTask((args as { id: string }).id, {
          include: ['project', 'project.company'],
        });
        return jsonResult(formatTask(result.data, result.included));
      }

      case 'productive_list_services': {
        const result = await api.getServices(args as Parameters<typeof api.getServices>[0]);
        return jsonResult(formatListResponse(result.data, formatService, result.meta));
      }

      case 'productive_list_people': {
        const result = await api.getPeople(args as Parameters<typeof api.getPeople>[0]);
        return jsonResult(formatListResponse(result.data, formatPerson, result.meta));
      }

      case 'productive_get_person': {
        const result = await api.getPerson((args as { id: string }).id);
        return jsonResult(formatPerson(result.data));
      }

      case 'productive_get_current_user': {
        if (credentials.userId) {
          const result = await api.getPerson(credentials.userId);
          return jsonResult(formatPerson(result.data));
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
