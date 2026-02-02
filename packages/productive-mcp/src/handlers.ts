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
  formatCompany,
  formatComment,
  formatTimer,
  formatDeal,
  formatBooking,
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
  resource: 'projects' | 'time' | 'tasks' | 'services' | 'people' | 'companies' | 'comments' | 'timers' | 'deals' | 'bookings';
  action: 'list' | 'get' | 'create' | 'update' | 'me' | 'start' | 'stop';
  id?: string;
  filter?: Record<string, unknown>;
  page?: number;
  per_page?: number;
  compact?: boolean;
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
      company_id,
      time,
      date,
      note,
      // Task fields
      title,
      project_id,
      task_list_id,
      description,
      assignee_id,
      // Company fields
      name,
      // Comment fields
      body,
      deal_id,
      // Timer fields
      time_entry_id,
      // Booking fields
      started_on,
      ended_on,
      event_id,
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



        if (action === 'list') {
          const result = await api.getTimeEntries({ filter: stringFilter, page, perPage });
          return jsonResult(
            formatListResponse(result.data, formatTimeEntry, result.meta, formatOptions)
          );
        }

        return errorResult(`Invalid action "${action}" for time. Use: list, get, create, update`);
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

        if (action === 'create') {
          if (!title || !project_id || !task_list_id) {
            return errorResult('title, project_id, and task_list_id are required for create');
          }
          const result = await api.createTask({
            title,
            project_id,
            task_list_id,
            assignee_id,
            description,
          });
          return jsonResult({ success: true, ...formatTask(result.data, formatOptions) });
        }

        if (action === 'update') {
          if (!id) return errorResult('id is required for update action');
          const updateData: Parameters<typeof api.updateTask>[1] = {};
          if (title !== undefined) updateData.title = title;
          if (description !== undefined) updateData.description = description;
          if (assignee_id !== undefined) updateData.assignee_id = assignee_id;
          const result = await api.updateTask(id, updateData);
          return jsonResult({ success: true, ...formatTask(result.data, formatOptions) });
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

        return errorResult(`Invalid action "${action}" for tasks. Use: list, get, create, update`);
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

      // ========================================================================
      // Companies
      // ========================================================================
      if (resource === 'companies') {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getCompany(id);
          return jsonResult(formatCompany(result.data, formatOptions));
        }

        if (action === 'create') {
          if (!name) return errorResult('name is required for create');
          const result = await api.createCompany({ name });
          return jsonResult({ success: true, ...formatCompany(result.data, formatOptions) });
        }

        if (action === 'update') {
          if (!id) return errorResult('id is required for update action');
          const updateData: Parameters<typeof api.updateCompany>[1] = {};
          if (name !== undefined) updateData.name = name;
          const result = await api.updateCompany(id, updateData);
          return jsonResult({ success: true, ...formatCompany(result.data, formatOptions) });
        }

        if (action === 'list') {
          const result = await api.getCompanies({ filter: stringFilter, page, perPage });
          return jsonResult(
            formatListResponse(result.data, formatCompany, result.meta, formatOptions)
          );
        }

        return errorResult(`Invalid action "${action}" for companies. Use: list, get, create, update`);
      }

      // ========================================================================
      // Comments
      // ========================================================================
      if (resource === 'comments') {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getComment(id, { include: ['creator'] });
          return jsonResult(formatComment(result.data, { ...formatOptions, included: result.included }));
        }

        if (action === 'create') {
          if (!body) return errorResult('body is required for create');
          if (!task_id && !deal_id && !company_id) {
            return errorResult('task_id, deal_id, or company_id is required for create');
          }
          const result = await api.createComment({
            body,
            task_id,
            deal_id,
            company_id,
          });
          return jsonResult({ success: true, ...formatComment(result.data, formatOptions) });
        }

        if (action === 'update') {
          if (!id) return errorResult('id is required for update action');
          if (!body) return errorResult('body is required for update');
          const result = await api.updateComment(id, { body });
          return jsonResult({ success: true, ...formatComment(result.data, formatOptions) });
        }

        if (action === 'list') {
          const result = await api.getComments({ filter: stringFilter, page, perPage, include: ['creator'] });
          return jsonResult(
            formatListResponse(result.data, formatComment, result.meta, {
              ...formatOptions,
              included: result.included,
            })
          );
        }

        return errorResult(`Invalid action "${action}" for comments. Use: list, get, create, update`);
      }

      // ========================================================================
      // Timers
      // ========================================================================
      if (resource === 'timers') {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getTimer(id);
          return jsonResult(formatTimer(result.data, formatOptions));
        }

        if (action === 'start' || action === 'create') {
          if (!service_id && !time_entry_id) {
            return errorResult('service_id or time_entry_id is required to start a timer');
          }
          const result = await api.startTimer({ service_id, time_entry_id });
          return jsonResult({ success: true, ...formatTimer(result.data, formatOptions) });
        }

        if (action === 'stop') {
          if (!id) return errorResult('id is required to stop a timer');
          const result = await api.stopTimer(id);
          return jsonResult({ success: true, ...formatTimer(result.data, formatOptions) });
        }

        if (action === 'list') {
          const result = await api.getTimers({ filter: stringFilter, page, perPage });
          return jsonResult(
            formatListResponse(result.data, formatTimer, result.meta, formatOptions)
          );
        }

        return errorResult(`Invalid action "${action}" for timers. Use: list, get, start, stop`);
      }

      // ========================================================================
      // Deals
      // ========================================================================
      if (resource === 'deals') {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getDeal(id, { include: ['company', 'deal_status', 'responsible'] });
          return jsonResult(formatDeal(result.data, { ...formatOptions, included: result.included }));
        }

        if (action === 'create') {
          if (!name || !company_id) {
            return errorResult('name and company_id are required for create');
          }
          const result = await api.createDeal({ name, company_id });
          return jsonResult({ success: true, ...formatDeal(result.data, formatOptions) });
        }

        if (action === 'update') {
          if (!id) return errorResult('id is required for update action');
          const updateData: Parameters<typeof api.updateDeal>[1] = {};
          if (name !== undefined) updateData.name = name;
          const result = await api.updateDeal(id, updateData);
          return jsonResult({ success: true, ...formatDeal(result.data, formatOptions) });
        }

        if (action === 'list') {
          const result = await api.getDeals({ filter: stringFilter, page, perPage, include: ['company', 'deal_status'] });
          return jsonResult(
            formatListResponse(result.data, formatDeal, result.meta, {
              ...formatOptions,
              included: result.included,
            })
          );
        }

        return errorResult(`Invalid action "${action}" for deals. Use: list, get, create, update`);
      }

      // ========================================================================
      // Bookings
      // ========================================================================
      if (resource === 'bookings') {
        if (action === 'get') {
          if (!id) return errorResult('id is required for get action');
          const result = await api.getBooking(id, { include: ['person', 'service'] });
          return jsonResult(formatBooking(result.data, { ...formatOptions, included: result.included }));
        }

        if (action === 'create') {
          if (!person_id || !started_on || !ended_on) {
            return errorResult('person_id, started_on, and ended_on are required for create');
          }
          if (!service_id && !event_id) {
            return errorResult('service_id or event_id is required for create');
          }
          const result = await api.createBooking({
            person_id,
            service_id,
            event_id,
            started_on,
            ended_on,
            time,
            note,
          });
          return jsonResult({ success: true, ...formatBooking(result.data, formatOptions) });
        }

        if (action === 'update') {
          if (!id) return errorResult('id is required for update action');
          const updateData: Parameters<typeof api.updateBooking>[1] = {};
          if (started_on !== undefined) updateData.started_on = started_on;
          if (ended_on !== undefined) updateData.ended_on = ended_on;
          if (time !== undefined) updateData.time = time;
          if (note !== undefined) updateData.note = note;
          const result = await api.updateBooking(id, updateData);
          return jsonResult({ success: true, ...formatBooking(result.data, formatOptions) });
        }

        if (action === 'list') {
          const result = await api.getBookings({ filter: stringFilter, page, perPage, include: ['person', 'service'] });
          return jsonResult(
            formatListResponse(result.data, formatBooking, result.meta, {
              ...formatOptions,
              included: result.included,
            })
          );
        }

        return errorResult(`Invalid action "${action}" for bookings. Use: list, get, create, update`);
      }

      return errorResult(`Unknown resource: ${resource}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(message);
    }
  }

  return errorResult(`Unknown tool: ${name}`);
}
