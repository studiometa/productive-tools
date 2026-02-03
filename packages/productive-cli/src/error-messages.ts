/**
 * Error messages factory for CLI commands
 *
 * Provides consistent, helpful error messages with recovery hints.
 * Similar to MCP's ErrorMessages but adapted for CLI usage patterns.
 *
 * @example
 * ```typescript
 * import { ErrorMessages } from './error-messages.js';
 *
 * if (!id) {
 *   throw ErrorMessages.missingId('get', 'time');
 * }
 * ```
 */

import { ValidationError, ConfigError } from './errors.js';

export const ErrorMessages = {
  // ==========================================================================
  // Required field errors
  // ==========================================================================

  /**
   * Error when an ID is required but not provided
   */
  missingId: (action: string, resource: string) =>
    ValidationError.required('id', [
      `Usage: productive ${resource} ${action} <id>`,
      `Find IDs using: productive ${resource} list --format json`,
    ]),

  /**
   * Error when multiple required fields are missing
   */
  missingRequiredFields: (resource: string, fields: string[]) =>
    new ValidationError(
      `${fields.join(', ')} ${fields.length === 1 ? 'is' : 'are'} required for creating ${resource}`,
      fields[0],
      undefined,
      [
        `Provide all required fields: ${fields.map((f) => `--${f}`).join(' ')}`,
        `Run: productive ${resource} add --help for detailed documentation`,
      ],
    ),

  // ==========================================================================
  // Time entry specific errors
  // ==========================================================================

  /**
   * Error when service ID is not provided for time entry
   */
  missingService: () =>
    ValidationError.required('service', [
      'Find services using: productive services list --project <project_id>',
      'Then use: productive time add --service <service_id>',
    ]),

  /**
   * Error when time is not provided for time entry
   */
  missingTime: () =>
    ValidationError.required('time', [
      'Specify time in minutes using: --time <minutes>',
      'Examples: --time 60 (1 hour), --time 480 (8 hours)',
    ]),

  /**
   * Error when person ID is not available
   */
  missingPersonId: () => ConfigError.missingUserId(),

  // ==========================================================================
  // Task specific errors
  // ==========================================================================

  /**
   * Error when title is not provided for task
   */
  missingTitle: () =>
    ValidationError.required('title', ['Provide a title using: --title "Task title"']),

  /**
   * Error when task list is not provided
   */
  missingTaskList: () =>
    ValidationError.required('task-list', [
      'Find task lists using: productive tasks list --project <project_id>',
      'Then use: productive tasks add --task-list <task_list_id>',
    ]),

  // ==========================================================================
  // Comment specific errors
  // ==========================================================================

  /**
   * Error when comment body is not provided
   */
  missingBody: () =>
    ValidationError.required('body', ['Provide comment content using: --body "Your comment"']),

  /**
   * Error when comment target is not provided
   */
  missingCommentTarget: () =>
    new ValidationError('A target is required for creating a comment', 'target', undefined, [
      'Provide one of: --task <id>, --deal <id>, or --company <id>',
      'Find targets using: productive tasks list, productive deals list, or productive companies list',
    ]),

  // ==========================================================================
  // Booking specific errors
  // ==========================================================================

  /**
   * Error when booking target is not provided
   */
  missingBookingTarget: () =>
    new ValidationError(
      'A service or event is required for creating a booking',
      'target',
      undefined,
      [
        'Provide either: --service <id> or --event <id>',
        'Find services using: productive services list',
      ],
    ),

  /**
   * Error when booking person is not provided
   */
  missingBookingPerson: () =>
    ValidationError.required('person', [
      'Specify who to book using: --person <person_id>',
      'Find people using: productive people list',
    ]),

  // ==========================================================================
  // Timer specific errors
  // ==========================================================================

  /**
   * Error when service is not provided for timer
   */
  missingTimerService: () =>
    ValidationError.required('service', [
      'Find services using: productive services list --project <project_id>',
      'Then start timer with: productive timers start --service <service_id>',
    ]),

  // ==========================================================================
  // Deal specific errors
  // ==========================================================================

  /**
   * Error when deal name is not provided
   */
  missingDealName: () =>
    ValidationError.required('name', ['Provide a deal name using: --name "Deal name"']),

  /**
   * Error when company is not provided for deal
   */
  missingDealCompany: () =>
    ValidationError.required('company', [
      'Find companies using: productive companies list',
      'Then use: productive deals add --company <company_id>',
    ]),

  // ==========================================================================
  // Company specific errors
  // ==========================================================================

  /**
   * Error when company name is not provided
   */
  missingCompanyName: () =>
    ValidationError.required('name', ['Provide a company name using: --name "Company name"']),

  // ==========================================================================
  // Report specific errors
  // ==========================================================================

  /**
   * Error when report type is invalid
   */
  invalidReportType: (type: string, validTypes: string[]) =>
    ValidationError.invalid('report type', type, `must be one of: ${validTypes.join(', ')}`, [
      'Run: productive reports --help for available report types',
    ]),

  // ==========================================================================
  // Generic validation errors
  // ==========================================================================

  /**
   * Error when no updates are specified for an update command
   */
  noUpdatesSpecified: (resource: string, fields: string[]) =>
    ValidationError.invalid(
      'options',
      {},
      `No updates specified. Use ${fields.map((f) => `--${f}`).join(', ')}`,
      [`Run: productive ${resource} update --help for available options`],
    ),

  /**
   * Error when an unknown subcommand is used
   */
  unknownSubcommand: (resource: string, subcommand: string, validSubcommands: string[]) =>
    new ValidationError(`Unknown subcommand: ${subcommand}`, 'subcommand', subcommand, [
      `Valid subcommands: ${validSubcommands.join(', ')}`,
      `Run: productive ${resource} --help for usage information`,
    ]),
} as const;
