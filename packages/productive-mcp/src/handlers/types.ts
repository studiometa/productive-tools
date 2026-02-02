/**
 * Shared types for resource handlers
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ProductiveApi } from '@studiometa/productive-cli';

import type { McpFormatOptions } from '../formatters.js';

export type ToolResult = CallToolResult;

/**
 * Context passed to each resource handler
 */
export interface HandlerContext {
  api: ProductiveApi;
  formatOptions: McpFormatOptions;
  filter?: Record<string, string>;
  page?: number;
  perPage: number;
  include?: string[];
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
