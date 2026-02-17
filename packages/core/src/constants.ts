/**
 * Shared constants for resources, actions, and report types.
 *
 * These arrays are the single source of truth for the entire monorepo.
 * Both CLI and MCP packages derive their resource/action lists from here.
 *
 * Adding a value here automatically propagates to:
 * - Zod validation schemas (MCP schema.ts)
 * - MCP tool definition exposed to clients (MCP tools.ts)
 * - Handler routing (MCP handlers/index.ts)
 * - CLI commands
 */

/**
 * Resource types available in Productive.io
 */
export const RESOURCES = [
  'projects',
  'time',
  'tasks',
  'services',
  'people',
  'companies',
  'comments',
  'attachments',
  'timers',
  'deals',
  'bookings',
  'pages',
  'discussions',
  'reports',
] as const;

export type Resource = (typeof RESOURCES)[number];

/**
 * Actions available across all resources.
 * Not every resource supports every action — see per-resource handler
 * validation for what's actually supported.
 */
export const ACTIONS = [
  'list',
  'get',
  'create',
  'update',
  'delete',
  'resolve',
  'reopen',
  'me',
  'start',
  'stop',
  'help',
] as const;

export type Action = (typeof ACTIONS)[number];

/**
 * Report types available in Productive.io
 */
export const REPORT_TYPES = [
  'time_reports',
  'project_reports',
  'budget_reports',
  'person_reports',
  'invoice_reports',
  'payment_reports',
  'service_reports',
  'task_reports',
  'company_reports',
  'deal_reports',
  'timesheet_reports',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

/**
 * @deprecated Use REPORT_TYPES instead
 */
export const VALID_REPORT_TYPES: ReportType[] = [...REPORT_TYPES];
