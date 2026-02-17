/**
 * Shared types for resource handlers
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ExecutorContext } from '@studiometa/productive-core';

import type { McpFormatOptions } from '../formatters.js';

export type ToolResult = CallToolResult;

/**
 * Context passed to each resource handler.
 *
 * Provides `executor()` to get an ExecutorContext for calling core executors.
 * Does NOT expose the raw API client — handlers must go through executors
 * to enforce the architecture contract.
 *
 * @example
 * ```typescript
 * export async function handleProjects(action, args, ctx) {
 *   const execCtx = ctx.executor();
 *   const result = await listProjects(options, execCtx);
 *   return jsonResult(formatListResponse(result.data, ...));
 * }
 * ```
 */
export interface HandlerContext {
  formatOptions: McpFormatOptions;
  filter?: Record<string, string>;
  page?: number;
  perPage: number;
  include?: string[];
  /** Whether to include contextual hints in responses (default: true) */
  includeHints?: boolean;
  /** Get an ExecutorContext for calling core executors */
  executor(): ExecutorContext;
}

/**
 * Common args shared across resources
 */
export interface CommonArgs {
  id?: string;
  person_id?: string;
  service_id?: string;
  task_id?: string;
  company_id?: string;
  time?: number;
  date?: string;
  note?: string;
}

/**
 * Task-specific args
 */
export interface TaskArgs extends CommonArgs {
  title?: string;
  project_id?: string;
  task_list_id?: string;
  description?: string;
  assignee_id?: string;
}

/**
 * Comment-specific args
 */
export interface CommentArgs extends CommonArgs {
  body?: string;
  deal_id?: string;
}

/**
 * Timer-specific args
 */
export interface TimerArgs extends CommonArgs {
  time_entry_id?: string;
}

/**
 * Deal-specific args
 */
export interface DealArgs extends CommonArgs {
  name?: string;
}

/**
 * Booking-specific args
 */
export interface BookingArgs extends CommonArgs {
  started_on?: string;
  ended_on?: string;
  event_id?: string;
}

/**
 * Company-specific args
 */
export interface CompanyArgs extends CommonArgs {
  name?: string;
}

/**
 * Resource handler function signature
 */
export type ResourceHandler<T extends CommonArgs = CommonArgs> = (
  action: string,
  args: T,
  ctx: HandlerContext,
) => Promise<ToolResult>;
