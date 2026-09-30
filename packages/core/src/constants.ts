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
  'activities',
  'batch',
  'search',
  'summaries',
  'workflows',
  'custom_fields',
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
  'schema',
  'run',
  'context',
  'my_day',
  'project_health',
  'team_pulse',
  'complete_task',
  'log_day',
  'weekly_standup',
] as const;

export type Action = (typeof ACTIONS)[number];

/**
 * Actions that mutate data. Used to gate the read-only `productive_read` MCP
 * tool and to classify calls in `run_script` dry-run mode.
 */
export const MUTATING_ACTIONS = [
  'create',
  'update',
  'delete',
  'start',
  'stop',
  'reopen',
  'complete_task',
  'log_day',
] as const satisfies readonly Action[];

export type MutatingAction = (typeof MUTATING_ACTIONS)[number];

export type ReadAction = Exclude<Action, MutatingAction>;

/**
 * Actions that only read data (ACTIONS minus MUTATING_ACTIONS).
 */
export const READ_ACTIONS: readonly ReadAction[] = ACTIONS.filter(
  (action): action is ReadAction => !(MUTATING_ACTIONS as readonly Action[]).includes(action),
);

/**
 * Whether a resource/action call mutates data.
 *
 * `resolve` is a read (name → ID lookup) on every resource except
 * `discussions`, where it marks the discussion as resolved.
 */
export function isMutatingCall(resource: unknown, action: unknown): boolean {
  if (resource === 'discussions' && action === 'resolve') return true;
  return (MUTATING_ACTIONS as readonly unknown[]).includes(action);
}

/**
 * Whether a resource/action call only reads data. This is an allowlist: it
 * returns false unless `resource` is a string and `action` is one of
 * READ_ACTIONS (exact match) that is not a write on that resource. Non-string
 * values (e.g. `['create']`, which JS turns into the key `"create"` on an
 * object lookup) are never a read.
 */
export function isReadCall(resource: unknown, action: unknown): boolean {
  if (typeof resource !== 'string' || typeof action !== 'string') return false;
  if (!(READ_ACTIONS as readonly string[]).includes(action)) return false;
  return !isMutatingCall(resource, action);
}

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
