/**
 * Custom error classes for MCP server
 *
 * These provide structured error handling with LLM-friendly messages
 * that include guidance on how to resolve issues.
 */

/**
 * Error thrown when user input validation fails.
 * These errors should be returned to the user directly.
 *
 * Includes optional hints for how to resolve the issue.
 */
export class UserInputError extends Error {
  public readonly hints?: string[];

  constructor(message: string, hints?: string[]) {
    super(message);
    this.name = 'UserInputError';
    this.hints = hints;
  }

  /**
   * Format error message with hints for LLM consumption
   */
  toFormattedMessage(): string {
    let msg = `**Input Error:** ${this.message}`;
    if (this.hints && this.hints.length > 0) {
      msg += '\n\n**Hints:**\n' + this.hints.map((h) => `- ${h}`).join('\n');
    }
    return msg;
  }
}

/**
 * Error messages with guidance for common validation failures
 */
export const ErrorMessages = {
  // Required field errors
  missingId: (action: string) =>
    new UserInputError(`id is required for ${action} action`, [
      `Use action="list" first to find the resource ID`,
      `Then use action="${action}" with the id parameter`,
    ]),

  missingRequiredFields: (resource: string, fields: string[]) =>
    new UserInputError(
      `${fields.join(', ')} ${fields.length === 1 ? 'is' : 'are'} required for creating ${resource}`,
      [
        `Provide all required fields: ${fields.join(', ')}`,
        `Use action="help" for detailed documentation on ${resource}`,
      ],
    ),

  // Invalid action errors
  invalidAction: (action: string, resource: string, validActions: string[]) =>
    new UserInputError(`Invalid action "${action}" for ${resource}`, [
      `Valid actions are: ${validActions.join(', ')}`,
      `Use action="help" with resource="${resource}" for detailed documentation`,
    ]),

  // Unknown resource errors
  unknownResource: (resource: string, validResources: string[]) =>
    new UserInputError(`Unknown resource: ${resource}`, [
      `Valid resources are: ${validResources.join(', ')}`,
      `Use action="help" without a resource for an overview of all resources`,
    ]),

  // Report-specific errors
  missingReportType: () =>
    new UserInputError('report_type is required for reports', [
      'Specify report_type parameter (e.g., "time_reports", "project_reports")',
      'Use action="help" with resource="reports" for available report types',
    ]),

  invalidReportType: (reportType: string, validTypes: string[]) =>
    new UserInputError(`Invalid report_type: ${reportType}`, [
      `Valid report types are: ${validTypes.join(', ')}`,
      'Use action="help" with resource="reports" for detailed documentation',
    ]),

  // Timer-specific errors
  missingServiceForTimer: () =>
    new UserInputError('service_id is required to start a timer', [
      'First find a service using resource="services" action="list"',
      'Then start the timer with the service_id',
    ]),

  // People-specific errors
  noUserIdConfigured: () =>
    new UserInputError('User ID not configured', [
      'The "me" action requires a user ID to be configured',
      'Use action="list" to find people, or configure the user ID',
    ]),

  // Comment-specific errors
  missingCommentTarget: () =>
    new UserInputError('A target is required for creating a comment', [
      'Provide one of: task_id, deal_id, or company_id',
      'Find targets using resource="tasks", "deals", or "companies" with action="list"',
    ]),

  // Booking-specific errors
  missingBookingTarget: () =>
    new UserInputError('A service or event is required for creating a booking', [
      'Provide either: service_id or event_id',
      'Find services using resource="services" with action="list"',
    ]),

  // API errors
  apiError: (statusCode: number, message: string) => {
    const hints: string[] = [];

    if (statusCode === 401) {
      hints.push('Check that your API token is valid and not expired');
      hints.push('Verify the organization ID is correct');
    } else if (statusCode === 403) {
      hints.push('You may not have permission to access this resource');
      hints.push('Check your API token permissions');
    } else if (statusCode === 404) {
      hints.push('The resource may not exist or you may not have access');
      hints.push('Verify the resource ID is correct');
      hints.push('Use action="list" to find valid resource IDs');
    } else if (statusCode === 422) {
      hints.push('The request data may be invalid');
      hints.push('Check the field values and types');
      hints.push('Use action="help" for field documentation');
    } else if (statusCode >= 500) {
      hints.push('This is a server error - try again later');
    }

    return new UserInputError(`API error (${statusCode}): ${message}`, hints);
  },
} as const;

/**
 * Check if an error is a UserInputError
 */
export function isUserInputError(error: unknown): error is UserInputError {
  return error instanceof UserInputError;
}
