/**
 * Tool execution handlers for Productive MCP server
 * These are shared between stdio and HTTP transports
 */

import { ProductiveApi } from '@studiometa/productive-cli';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ProductiveCredentials } from './auth.js';

export type ToolResult = CallToolResult;

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
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_get_project': {
        const result = await api.getProject((args as { id: string }).id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_list_time_entries': {
        const result = await api.getTimeEntries(args as Parameters<typeof api.getTimeEntries>[0]);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_get_time_entry': {
        const result = await api.getTimeEntry((args as { id: string }).id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_create_time_entry': {
        const result = await api.createTimeEntry(
          args as Parameters<typeof api.createTimeEntry>[0]
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_update_time_entry': {
        const { id, ...data } = args as { id: string } & Record<string, unknown>;
        const result = await api.updateTimeEntry(id, data as Parameters<typeof api.updateTimeEntry>[1]);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_delete_time_entry': {
        await api.deleteTimeEntry((args as { id: string }).id);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, message: 'Time entry deleted' }, null, 2) }],
        };
      }

      case 'productive_list_tasks': {
        const result = await api.getTasks(args as Parameters<typeof api.getTasks>[0]);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_get_task': {
        const result = await api.getTask((args as { id: string }).id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_list_services': {
        const result = await api.getServices(args as Parameters<typeof api.getServices>[0]);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_list_people': {
        const result = await api.getPeople(args as Parameters<typeof api.getPeople>[0]);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_get_person': {
        const result = await api.getPerson((args as { id: string }).id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'productive_get_current_user': {
        // If userId is provided in credentials, fetch that person
        if (credentials.userId) {
          const result = await api.getPerson(credentials.userId);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }
        // Otherwise return info about what we know
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'User ID not provided in credentials. Include userId in your auth token to use this tool.',
                  organizationId: credentials.organizationId,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}
