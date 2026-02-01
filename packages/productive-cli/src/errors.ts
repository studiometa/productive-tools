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
 */

/**
 * Base error class for all CLI errors.
 * Provides a consistent structure for error information.
 */
export abstract class CliError extends Error {
  abstract readonly code: string;
  abstract readonly isRecoverable: boolean;

  constructor(
    message: string,
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
      ...(this.cause instanceof Error
        ? { cause: { message: this.cause.message } }
        : {}),
    };
  }
}

// ============================================================================
// Configuration Errors
// ============================================================================

export class ConfigError extends CliError {
  readonly code = "CONFIG_ERROR";
  readonly isRecoverable = true;

  constructor(
    message: string,
    public readonly missingKeys?: string[],
    cause?: unknown,
  ) {
    super(message, cause);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      missingKeys: this.missingKeys,
    };
  }

  static missingToken(): ConfigError {
    return new ConfigError(
      "API token not configured. Set via: --token <token>, productive config set apiToken <token>, or PRODUCTIVE_API_TOKEN env var",
      ["apiToken"],
    );
  }

  static missingOrganizationId(): ConfigError {
    return new ConfigError(
      "Organization ID not configured. Set via: --org-id <id>, productive config set organizationId <id>, or PRODUCTIVE_ORG_ID env var",
      ["organizationId"],
    );
  }

  static missingUserId(): ConfigError {
    return new ConfigError(
      "User ID not configured. Set via: --user-id <id>, productive config set userId <id>, or PRODUCTIVE_USER_ID env var",
      ["userId"],
    );
  }

  static invalid(key: string, reason: string): ConfigError {
    return new ConfigError(`Invalid configuration for '${key}': ${reason}`);
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends CliError {
  readonly code = "VALIDATION_ERROR";
  readonly isRecoverable = true;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    cause?: unknown,
  ) {
    super(message, cause);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value,
    };
  }

  static required(field: string): ValidationError {
    return new ValidationError(`${field} is required`, field);
  }

  static invalid(field: string, value: unknown, reason: string): ValidationError {
    return new ValidationError(
      `Invalid ${field}: ${reason}`,
      field,
      value,
    );
  }

  static invalidDate(value: string): ValidationError {
    return new ValidationError(
      `Invalid date format: '${value}'. Use YYYY-MM-DD, 'today', 'yesterday', or relative formats like '2 days ago'`,
      "date",
      value,
    );
  }

  static invalidId(field: string, value: string): ValidationError {
    return new ValidationError(
      `Invalid ${field}: '${value}' is not a valid ID`,
      field,
      value,
    );
  }
}

// ============================================================================
// API Errors
// ============================================================================

/**
 * API error codes
 */
export type ApiErrorCode =
  | "API_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND_ERROR"
  | "RATE_LIMIT_ERROR"
  | "SERVER_ERROR";

/**
 * Base class for API-related errors
 */
export class ApiError extends CliError {
  readonly code: ApiErrorCode = "API_ERROR";
  readonly isRecoverable: boolean;

  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
    public readonly response?: unknown,
    cause?: unknown,
  ) {
    super(message, cause);
    // 5xx errors and network errors are potentially recoverable with retry
    this.isRecoverable =
      statusCode === undefined || (statusCode >= 500 && statusCode < 600);
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
    const message =
      cause instanceof Error ? cause.message : "Network request failed";
    return new ApiError(
      `Network error while requesting ${endpoint}: ${message}`,
      undefined,
      endpoint,
      undefined,
      cause,
    );
  }
}

export class AuthenticationError extends ApiError {
  override readonly code: ApiErrorCode = "AUTHENTICATION_ERROR";
  override readonly isRecoverable = false;

  constructor(message: string, endpoint?: string, response?: unknown) {
    super(
      message || "Authentication failed. Please check your API token.",
      401,
      endpoint,
      response,
    );
  }
}

export class AuthorizationError extends ApiError {
  override readonly code: ApiErrorCode = "AUTHORIZATION_ERROR";
  override readonly isRecoverable = false;

  constructor(message: string, endpoint?: string, response?: unknown) {
    super(
      message ||
        "Access denied. You do not have permission to perform this action.",
      403,
      endpoint,
      response,
    );
  }
}

export class NotFoundError extends ApiError {
  override readonly code: ApiErrorCode = "NOT_FOUND_ERROR";
  override readonly isRecoverable = false;

  constructor(message: string, endpoint?: string, response?: unknown) {
    super(message || "The requested resource was not found.", 404, endpoint, response);
  }
}

export class RateLimitError extends ApiError {
  override readonly code: ApiErrorCode = "RATE_LIMIT_ERROR";
  override readonly isRecoverable = true;

  constructor(
    message: string,
    endpoint?: string,
    response?: unknown,
    public readonly retryAfter?: number,
  ) {
    super(
      message || "Rate limit exceeded. Please wait before making more requests.",
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
  override readonly code: ApiErrorCode = "SERVER_ERROR";
  override readonly isRecoverable = true;

  constructor(
    message: string,
    statusCode: number,
    endpoint?: string,
    response?: unknown,
  ) {
    super(
      message || "The server encountered an error. Please try again later.",
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
  readonly code = "CACHE_ERROR";
  readonly isRecoverable = true;

  constructor(
    message: string,
    public readonly operation?: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
    };
  }

  static readFailed(cause: unknown): CacheError {
    return new CacheError("Failed to read from cache", "read", cause);
  }

  static writeFailed(cause: unknown): CacheError {
    return new CacheError("Failed to write to cache", "write", cause);
  }

  static invalidateFailed(cause: unknown): CacheError {
    return new CacheError("Failed to invalidate cache", "invalidate", cause);
  }
}

// ============================================================================
// Command Errors
// ============================================================================

export class CommandError extends CliError {
  readonly code = "COMMAND_ERROR";
  readonly isRecoverable = false;

  constructor(
    message: string,
    public readonly command?: string,
    public readonly subcommand?: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }

  override toJSON() {
    return {
      ...super.toJSON(),
      command: this.command,
      subcommand: this.subcommand,
    };
  }

  static unknownCommand(command: string): CommandError {
    return new CommandError(`Unknown command: ${command}`, command);
  }

  static unknownSubcommand(command: string, subcommand: string): CommandError {
    return new CommandError(
      `Unknown subcommand: ${subcommand}`,
      command,
      subcommand,
    );
  }

  static missingArgument(
    command: string,
    argument: string,
    usage: string,
  ): CommandError {
    return new CommandError(
      `Missing required argument: ${argument}\nUsage: ${usage}`,
      command,
    );
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
  if (
    error instanceof Error &&
    error.name === "ProductiveApiError" &&
    "statusCode" in error
  ) {
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
    return new ApiError(error.message, undefined, undefined, undefined, error);
  }

  return new ApiError(String(error));
}
