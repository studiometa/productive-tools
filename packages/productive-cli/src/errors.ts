/**
 * Typed error hierarchy for the productive-cli.
 *
 * This provides specific error types for different failure scenarios,
 * enabling better error handling and more informative error messages.
 *
 * Error hierarchy:
 * - CliError (base)
 *   - ConfigError (configuration issues)
 *   - ValidationError (input validation failures)
 *   - ApiError (API communication issues)
 *     - AuthenticationError (401)
 *     - AuthorizationError (403)
 *     - NotFoundError (404)
 *     - RateLimitError (429)
 *     - ServerError (5xx)
 *   - CacheError (cache operations)
 *   - CommandError (command execution issues)
 *
 * All errors support optional hints for recovery guidance,
 * making them more useful for both humans and AI agents.
 */

/**
 * Base error class for all CLI errors.
 * Provides a consistent structure for error information.
 *
 * Supports optional hints for recovery guidance, which are displayed
 * in human-readable format and included in JSON output for AI agents.
 */
export abstract class CliError extends Error {
  abstract readonly code: string;
  abstract readonly isRecoverable: boolean;

  constructor(
    message: string,
    public readonly hints?: string[],
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a JSON representation for structured output
   */
  toJSON(): Record<string, unknown> {
    return {
      error: this.code,
      name: this.name,
      message: this.message,
      isRecoverable: this.isRecoverable,
      ...(this.hints && this.hints.length > 0 ? { hints: this.hints } : {}),
      ...(this.cause instanceof Error ? { cause: { message: this.cause.message } } : {}),
    };
  }

  /**
   * Format error message with hints for human/LLM consumption.
   * Used for human-readable output with recovery guidance.
   */
  toFormattedMessage(): string {
    let msg = this.message;
    if (this.hints && this.hints.length > 0) {
      msg += '\n\nHints:\n' + this.hints.map((h) => `  • ${h}`).join('\n');
    }
    return msg;
  }
}

// ============================================================================
// Configuration Errors
// ============================================================================

export class ConfigError extends CliError {
  readonly code = 'CONFIG_ERROR';
  readonly isRecoverable = true;

  constructor(
    message: string,
    public readonly missingKeys?: string[],
    hints?: string[],
    cause?: unknown,
  ) {
    super(message, hints, cause);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      missingKeys: this.missingKeys,
    };
  }

  static missingToken(): ConfigError {
    return new ConfigError(
      'API token not configured',
      ['apiToken'],
      [
        'Set via CLI flag: --token <token>',
        'Set via config: productive config set apiToken <token>',
        'Set via environment: export PRODUCTIVE_API_TOKEN=<token>',
      ],
    );
  }

  static missingOrganizationId(): ConfigError {
    return new ConfigError(
      'Organization ID not configured',
      ['organizationId'],
      [
        'Set via CLI flag: --org-id <id>',
        'Set via config: productive config set organizationId <id>',
        'Set via environment: export PRODUCTIVE_ORG_ID=<id>',
        'Find your org ID in Productive settings or API response headers',
      ],
    );
  }

  static missingUserId(): ConfigError {
    return new ConfigError(
      'User ID not configured',
      ['userId'],
      [
        'Set via CLI flag: --user-id <id>',
        'Set via config: productive config set userId <id>',
        'Set via environment: export PRODUCTIVE_USER_ID=<id>',
        'Find your user ID with: productive people list --format json',
      ],
    );
  }

  static invalid(key: string, reason: string): ConfigError {
    return new ConfigError(
      `Invalid configuration for '${key}': ${reason}`,
      [key],
      [
        `Check the value of '${key}' in your config`,
        'Run: productive config get to see current values',
      ],
    );
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends CliError {
  readonly code = 'VALIDATION_ERROR';
  readonly isRecoverable = true;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    hints?: string[],
    cause?: unknown,
  ) {
    super(message, hints, cause);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
    };
  }

  static required(field: string, hints?: string[]): ValidationError {
    return new ValidationError(`${field} is required`, field, undefined, hints);
  }

  static invalid(field: string, value: unknown, reason: string, hints?: string[]): ValidationError {
    return new ValidationError(`Invalid ${field}: ${reason}`, field, value, hints);
  }

  static invalidDate(value: string): ValidationError {
    return new ValidationError(`Invalid date format: '${value}'`, 'date', value, [
      'Use YYYY-MM-DD format (e.g., 2024-01-15)',
      "Use relative formats: 'today', 'yesterday', '2 days ago'",
      'Use month names: 2024-jan-15',
    ]);
  }

  static invalidId(field: string, value: string): ValidationError {
    return new ValidationError(`Invalid ${field}: '${value}' is not a valid ID`, field, value, [
      `Use 'productive ${field.replace('_id', 's')} list' to find valid IDs`,
    ]);
  }
}

// ============================================================================
// API Errors
// ============================================================================

/**
 * API error codes
 */
export type ApiErrorCode =
  | 'API_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'SERVER_ERROR';

/**
 * Get hints for an API error based on status code
 */
function getApiErrorHints(statusCode?: number): string[] {
  if (statusCode === 401) {
    return [
      'Check that your API token is valid and not expired',
      'Verify the organization ID is correct',
      'Run: productive config validate',
    ];
  }
  if (statusCode === 403) {
    return [
      'You may not have permission to access this resource',
      'Check your API token permissions in Productive settings',
    ];
  }
  if (statusCode === 404) {
    return [
      'The resource may not exist or you may not have access',
      'Verify the resource ID is correct',
      "Use 'list' command to find valid resource IDs",
    ];
  }
  if (statusCode === 422) {
    return [
      'The request data may be invalid',
      'Check the field values and types',
      'Run command with --help for field documentation',
    ];
  }
  if (statusCode === 429) {
    return [
      'Too many requests - wait before retrying',
      'Consider using pagination with smaller page sizes',
    ];
  }
  if (statusCode && statusCode >= 500) {
    return ['This is a server error - try again later', 'If the issue persists, contact support'];
  }
  return [];
}

/**
 * Base class for API-related errors
 */
export class ApiError extends CliError {
  readonly code: ApiErrorCode = 'API_ERROR';
  readonly isRecoverable: boolean;

  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
    public readonly response?: unknown,
    hints?: string[],
    cause?: unknown,
  ) {
    super(message, hints ?? getApiErrorHints(statusCode), cause);
    // 5xx errors and network errors are potentially recoverable with retry
    this.isRecoverable = statusCode === undefined || (statusCode >= 500 && statusCode < 600);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      endpoint: this.endpoint,
      response: this.response,
    };
  }

  /**
   * Creates the appropriate error subclass based on status code
   */
  static fromResponse(
    statusCode: number,
    message: string,
    endpoint?: string,
    response?: unknown,
  ): ApiError {
    switch (statusCode) {
      case 401:
        return new AuthenticationError(message, endpoint, response);
      case 403:
        return new AuthorizationError(message, endpoint, response);
      case 404:
        return new NotFoundError(message, endpoint, response);
      case 429:
        return new RateLimitError(message, endpoint, response);
      default:
        if (statusCode >= 500) {
          return new ServerError(message, statusCode, endpoint, response);
        }
        return new ApiError(message, statusCode, endpoint, response);
    }
  }

  static networkError(endpoint: string, cause: unknown): ApiError {
    const message = cause instanceof Error ? cause.message : 'Network request failed';
    return new ApiError(
      `Network error while requesting ${endpoint}: ${message}`,
      undefined,
      endpoint,
      undefined,
      ['Check your internet connection', 'Verify the API base URL is correct'],
      cause,
    );
  }
}

export class AuthenticationError extends ApiError {
  override readonly code: ApiErrorCode = 'AUTHENTICATION_ERROR';
  override readonly isRecoverable = false;

  constructor(message: string, endpoint?: string, response?: unknown) {
    super(
      message || 'Authentication failed. Please check your API token.',
      401,
      endpoint,
      response,
    );
  }
}

export class AuthorizationError extends ApiError {
  override readonly code: ApiErrorCode = 'AUTHORIZATION_ERROR';
  override readonly isRecoverable = false;

  constructor(message: string, endpoint?: string, response?: unknown) {
    super(
      message || 'Access denied. You do not have permission to perform this action.',
      403,
      endpoint,
      response,
    );
  }
}

export class NotFoundError extends ApiError {
  override readonly code: ApiErrorCode = 'NOT_FOUND_ERROR';
  override readonly isRecoverable = false;

  constructor(message: string, endpoint?: string, response?: unknown) {
    super(message || 'The requested resource was not found.', 404, endpoint, response);
  }
}

export class RateLimitError extends ApiError {
  override readonly code: ApiErrorCode = 'RATE_LIMIT_ERROR';
  override readonly isRecoverable = true;

  constructor(
    message: string,
    endpoint?: string,
    response?: unknown,
    public readonly retryAfter?: number,
  ) {
    super(
      message || 'Rate limit exceeded. Please wait before making more requests.',
      429,
      endpoint,
      response,
    );
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

export class ServerError extends ApiError {
  override readonly code: ApiErrorCode = 'SERVER_ERROR';
  override readonly isRecoverable = true;

  constructor(message: string, statusCode: number, endpoint?: string, response?: unknown) {
    super(
      message || 'The server encountered an error. Please try again later.',
      statusCode,
      endpoint,
      response,
    );
  }
}

// ============================================================================
// Cache Errors
// ============================================================================

export class CacheError extends CliError {
  readonly code = 'CACHE_ERROR';
  readonly isRecoverable = true;

  constructor(
    message: string,
    public readonly operation?: string,
    hints?: string[],
    cause?: unknown,
  ) {
    super(message, hints, cause);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
    };
  }

  static readFailed(cause: unknown): CacheError {
    return new CacheError(
      'Failed to read from cache',
      'read',
      ['Try running with --no-cache to bypass cache', 'Run: productive cache clear to reset cache'],
      cause,
    );
  }

  static writeFailed(cause: unknown): CacheError {
    return new CacheError(
      'Failed to write to cache',
      'write',
      ['Check disk space and permissions', 'Try running with --no-cache to bypass cache'],
      cause,
    );
  }

  static invalidateFailed(cause: unknown): CacheError {
    return new CacheError(
      'Failed to invalidate cache',
      'invalidate',
      ['Try running: productive cache clear'],
      cause,
    );
  }
}

// ============================================================================
// Command Errors
// ============================================================================

export class CommandError extends CliError {
  readonly code = 'COMMAND_ERROR';
  readonly isRecoverable = false;

  constructor(
    message: string,
    public readonly command?: string,
    public readonly subcommand?: string,
    hints?: string[],
    cause?: unknown,
  ) {
    super(message, hints, cause);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      command: this.command,
      subcommand: this.subcommand,
    };
  }

  static unknownCommand(command: string): CommandError {
    return new CommandError(`Unknown command: ${command}`, command, undefined, [
      'Run: productive --help to see available commands',
      'Available commands: projects, time, tasks, people, services, budgets, companies, comments, timers, deals, bookings, reports',
    ]);
  }

  static unknownSubcommand(command: string, subcommand: string): CommandError {
    return new CommandError(`Unknown subcommand: ${subcommand}`, command, subcommand, [
      `Run: productive ${command} --help to see available subcommands`,
    ]);
  }

  static missingArgument(command: string, argument: string, usage: string): CommandError {
    return new CommandError(`Missing required argument: ${argument}`, command, undefined, [
      `Usage: ${usage}`,
    ]);
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isCliError(error: unknown): error is CliError {
  return error instanceof CliError;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isRecoverable(error: unknown): boolean {
  if (error instanceof CliError) {
    return error.isRecoverable;
  }
  return false;
}

// ============================================================================
// Migration helper: Convert ProductiveApiError to new error types
// ============================================================================

/**
 * Converts a legacy ProductiveApiError to the new error hierarchy.
 * Use this during migration to gradually adopt new error types.
 */
export function fromLegacyError(error: unknown): CliError {
  if (error instanceof CliError) {
    return error;
  }

  // Handle legacy ProductiveApiError
  if (error instanceof Error && error.name === 'ProductiveApiError' && 'statusCode' in error) {
    const legacyError = error as Error & {
      statusCode?: number;
      response?: unknown;
    };
    return ApiError.fromResponse(
      legacyError.statusCode ?? 500,
      legacyError.message,
      undefined,
      legacyError.response,
    );
  }

  // Wrap unknown errors
  if (error instanceof Error) {
    return new ApiError(error.message, undefined, undefined, undefined, undefined, error);
  }

  return new ApiError(String(error));
}
