/**
 * Zod schemas for MCP tool parameter validation
 *
 * These schemas provide:
 * - Runtime validation with helpful error messages
 * - Automatic transforms (trim, lowercase where appropriate)
 * - LLM-friendly descriptions
 * - TypeScript type inference
 */

import { z, parse, safeParse, type ZodSafeParseResult, type ZodError } from 'zod';

// =============================================================================
// Base Schemas
// =============================================================================

/**
 * Resource types available in Productive.io
 */
export const ResourceSchema = z.enum([
  'projects',
  'time',
  'tasks',
  'services',
  'people',
  'companies',
  'comments',
  'timers',
  'deals',
  'bookings',
  'reports',
]);

export type Resource = z.infer<typeof ResourceSchema>;

/**
 * Actions available for resources
 */
export const ActionSchema = z.enum([
  'list',
  'get',
  'create',
  'update',
  'me',
  'start',
  'stop',
  'help',
]);

export type Action = z.infer<typeof ActionSchema>;

/**
 * Report types available in Productive.io
 */
export const ReportTypeSchema = z.enum([
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
]);

export type ReportType = z.infer<typeof ReportTypeSchema>;

// =============================================================================
// Parameter Schemas
// =============================================================================

/**
 * Resource ID parameter
 */
export const ParamId = z
  .string()
  .trim()
  .min(1, 'ID cannot be empty')
  .describe('The unique identifier of the resource');

/**
 * Person ID parameter
 */
export const ParamPersonId = z
  .string()
  .trim()
  .describe(
    'Person ID. Use "me" for current user (requires configured user ID), or a specific person ID from people list',
  );

/**
 * Service ID parameter
 */
export const ParamServiceId = z
  .string()
  .trim()
  .describe(
    'Service ID. Find services using resource="services" action="list" with project_id filter',
  );

/**
 * Project ID parameter
 */
export const ParamProjectId = z
  .string()
  .trim()
  .describe('Project ID. Find projects using resource="projects" action="list"');

/**
 * Task ID parameter
 */
export const ParamTaskId = z
  .string()
  .trim()
  .describe('Task ID. Find tasks using resource="tasks" action="list"');

/**
 * Company ID parameter
 */
export const ParamCompanyId = z
  .string()
  .trim()
  .describe('Company ID. Find companies using resource="companies" action="list"');

/**
 * Deal ID parameter
 */
export const ParamDealId = z
  .string()
  .trim()
  .describe('Deal ID. Find deals using resource="deals" action="list"');

/**
 * Date parameter (YYYY-MM-DD format)
 */
export const ParamDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .describe('Date in YYYY-MM-DD format (e.g., "2024-01-15")');

/**
 * Time in minutes parameter
 */
export const ParamTimeMinutes = z
  .number()
  .int()
  .min(1, 'Time must be at least 1 minute')
  .max(1440, 'Time cannot exceed 24 hours (1440 minutes)')
  .describe('Time in minutes. Examples: 60 = 1 hour, 480 = 8 hours (full day), 240 = 4 hours');

/**
 * Page number parameter
 */
export const ParamPage = z
  .number()
  .int()
  .min(1, 'Page must be at least 1')
  .default(1)
  .describe('Page number for pagination (starts at 1)');

/**
 * Page size parameter
 */
export const ParamPerPage = z
  .number()
  .int()
  .min(1, 'Per page must be at least 1')
  .max(200, 'Per page cannot exceed 200')
  .default(20)
  .describe('Number of items per page (default: 20, max: 200)');

/**
 * Compact output parameter
 */
export const ParamCompact = z
  .boolean()
  .optional()
  .describe(
    'Compact output mode. Default: true for list (less detail), false for get (full detail)',
  );

/**
 * Search query parameter
 */
export const ParamQuery = z
  .string()
  .trim()
  .min(1, 'Search query cannot be empty')
  .describe(
    'Text search query - behavior varies by resource, may include related fields (e.g., project names for tasks)',
  );

/**
 * Include related resources parameter
 */
export const ParamInclude = z
  .array(z.string().trim())
  .describe(
    'Related resources to include. Examples: ["project", "assignee", "comments"]. Reduces API calls by fetching related data.',
  );

/**
 * Note/description text parameter
 */
export const ParamNote = z.string().describe('Note or description text');

/**
 * Title parameter
 */
export const ParamTitle = z
  .string()
  .trim()
  .min(1, 'Title cannot be empty')
  .describe('Title or name of the resource');

/**
 * Body/content parameter (for comments)
 */
export const ParamBody = z
  .string()
  .min(1, 'Body cannot be empty')
  .describe('Comment body or content');

// =============================================================================
// Filter Schemas
// =============================================================================

/**
 * Base filter schema
 */
export const FilterSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .describe('Filter criteria for list actions');

// =============================================================================
// Consolidated Tool Input Schema
// =============================================================================

/**
 * Full input schema for the productive tool
 * Used for validation and type inference
 */
export const ProductiveToolInputSchema = z.object({
  resource: ResourceSchema,
  action: ActionSchema,

  // Common parameters
  id: ParamId.optional(),
  filter: FilterSchema,
  page: ParamPage.optional(),
  per_page: ParamPerPage.optional(),
  compact: ParamCompact,
  include: ParamInclude.optional(),
  query: ParamQuery.optional(),

  // ID references
  person_id: ParamPersonId.optional(),
  service_id: ParamServiceId.optional(),
  task_id: ParamTaskId.optional(),
  company_id: ParamCompanyId.optional(),
  deal_id: ParamDealId.optional(),
  project_id: ParamProjectId.optional(),

  // Time entry fields
  time: ParamTimeMinutes.optional(),
  date: ParamDate.optional(),
  note: ParamNote.optional(),

  // Task fields
  title: ParamTitle.optional(),
  task_list_id: z.string().trim().optional().describe('Task list ID within the project'),
  description: z.string().optional().describe('Detailed description'),
  assignee_id: z.string().trim().optional().describe('Person ID to assign the task to'),

  // Company fields
  name: z.string().trim().optional().describe('Company or deal name'),

  // Comment fields
  body: ParamBody.optional(),

  // Timer fields
  time_entry_id: z.string().trim().optional().describe('Time entry ID to associate with timer'),

  // Booking fields
  started_on: ParamDate.optional().describe('Booking start date (YYYY-MM-DD)'),
  ended_on: ParamDate.optional().describe('Booking end date (YYYY-MM-DD)'),
  event_id: z.string().trim().optional().describe('Event ID for the booking'),

  // Report fields
  report_type: ReportTypeSchema.optional(),
  group: z
    .string()
    .trim()
    .optional()
    .describe('Grouping for reports (e.g., "person", "project", "service")'),
  from: ParamDate.optional().describe('Report start date (YYYY-MM-DD)'),
  to: ParamDate.optional().describe('Report end date (YYYY-MM-DD)'),
  status: z.string().trim().optional().describe('Status filter for reports'),
});

export type ProductiveToolInput = z.infer<typeof ProductiveToolInputSchema>;

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate and parse tool input
 * Returns parsed data or throws with validation errors
 */
export function validateToolInput(input: unknown): ProductiveToolInput {
  return parse(ProductiveToolInputSchema, input);
}

/**
 * Safely validate tool input without throwing
 * Returns success/error result
 */
export function safeValidateToolInput(input: unknown): ZodSafeParseResult<ProductiveToolInput> {
  return safeParse(ProductiveToolInputSchema, input);
}

/**
 * Format Zod validation errors for LLM consumption
 */
export function formatValidationErrors(error: ZodError<ProductiveToolInput>): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `- ${path}${issue.message}`;
  });

  return `**Validation Error:**\n${issues.join('\n')}`;
}
