/**
 * Centralized error handling for the productive-cli.
 *
 * This module provides a single place for error handling logic,
 * replacing the duplicated handleError functions in each command file.
 *
 * Features:
 * - Consistent error output across all commands
 * - Format-aware error rendering (JSON vs human)
 * - Proper exit code management
 * - Error categorization for different exit codes
 *
 * @example
 * ```typescript
 * import { handleError, runCommand } from './error-handler.js';
 *
 * // Option 1: Manual error handling
 * try {
 *   await doSomething();
 * } catch (error) {
 *   handleError(error, formatter);
 * }
 *
 * // Option 2: Wrapped execution with automatic error handling
 * await runCommand(async () => {
 *   await doSomething();
 * }, formatter);
 * ```
 */

import type { OutputFormatter } from "./output.js";
import {
  CliError,
  ApiError,
  AuthenticationError,
  ConfigError,
  ValidationError,
  isCliError,
  fromLegacyError,
} from "./errors.js";
import { ProductiveApiError } from "./api.js";
import type { Result } from "./utils/result.js";

/**
 * Exit codes for different error categories
 */
export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  AUTHENTICATION_ERROR: 2,
  VALIDATION_ERROR: 3,
  CONFIG_ERROR: 4,
  NOT_FOUND_ERROR: 5,
} as const;

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode];

/**
 * Determines the appropriate exit code for an error
 */
export function getExitCode(error: unknown): ExitCode {
  if (error instanceof AuthenticationError) {
    return ExitCode.AUTHENTICATION_ERROR;
  }
  if (error instanceof ValidationError) {
    return ExitCode.VALIDATION_ERROR;
  }
  if (error instanceof ConfigError) {
    return ExitCode.CONFIG_ERROR;
  }
  if (error instanceof ApiError && error.statusCode === 404) {
    return ExitCode.NOT_FOUND_ERROR;
  }
  return ExitCode.GENERAL_ERROR;
}

/**
 * Central error handler for all commands.
 *
 * Converts errors to the appropriate output format and exits with the correct code.
 *
 * @param error - The error to handle (can be any type)
 * @param formatter - The output formatter for rendering
 * @param options - Optional configuration
 * @param options.exit - Whether to call process.exit (default: true)
 * @returns The exit code (only if exit is false)
 */
export function handleError(
  error: unknown,
  formatter: OutputFormatter,
  options?: { exit?: boolean },
): ExitCode {
  const shouldExit = options?.exit ?? true;

  // Convert legacy errors to new error types
  let cliError: CliError;
  if (error instanceof ProductiveApiError) {
    cliError = ApiError.fromResponse(
      error.statusCode ?? 500,
      error.message,
      undefined,
      error.response,
    );
  } else if (isCliError(error)) {
    cliError = error;
  } else {
    cliError = fromLegacyError(error);
  }

  // Output error in appropriate format
  const format = (formatter as unknown as { format: string }).format;
  if (format === "json") {
    formatter.output(cliError.toJSON());
  } else {
    formatter.error(cliError.message);

    // Show additional context for certain error types
    if (cliError instanceof ConfigError && cliError.missingKeys?.length) {
      console.error(`Missing: ${cliError.missingKeys.join(", ")}`);
    }
  }

  const exitCode = getExitCode(cliError);

  if (shouldExit) {
    process.exit(exitCode);
  }

  return exitCode;
}

/**
 * Handles a Result type, outputting data on success or error on failure.
 *
 * @param result - The Result to handle
 * @param formatter - The output formatter
 * @param onSuccess - Optional callback for successful results
 * @returns true if successful, false if error
 */
export function handleResult<E extends CliError, T>(
  result: Result<E, T>,
  formatter: OutputFormatter,
  onSuccess?: (value: T) => void,
): boolean {
  if (result.ok) {
    if (onSuccess) {
      onSuccess(result.value);
    } else {
      formatter.output(result.value);
    }
    return true;
  }

  handleError(result.error, formatter);
  return false;
}

/**
 * Wraps a command function with automatic error handling.
 *
 * This is a convenience wrapper that catches any errors thrown by the
 * command function and handles them consistently.
 *
 * @example
 * ```typescript
 * await runCommand(async () => {
 *   const api = new ProductiveApi(options);
 *   const response = await api.getProjects();
 *   formatter.output(response.data);
 * }, formatter);
 * ```
 */
export async function runCommand<T>(
  fn: () => Promise<T>,
  formatter: OutputFormatter,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, formatter);
    return undefined; // unreachable due to process.exit, but TypeScript needs this
  }
}

/**
 * Wraps a synchronous command function with automatic error handling.
 */
export function runCommandSync<T>(
  fn: () => T,
  formatter: OutputFormatter,
): T | undefined {
  try {
    return fn();
  } catch (error) {
    handleError(error, formatter);
    return undefined;
  }
}

/**
 * Creates a formatted validation error and exits.
 * Use this for consistent argument validation across commands.
 *
 * @example
 * ```typescript
 * if (!id) {
 *   exitWithValidationError('id', 'productive time get <id>', formatter);
 * }
 * ```
 */
export function exitWithValidationError(
  field: string,
  usage: string,
  formatter: OutputFormatter,
): never {
  const error = ValidationError.required(field);
  const format = (formatter as unknown as { format: string }).format;

  if (format === "json") {
    formatter.output({
      ...error.toJSON(),
      usage,
    });
  } else {
    formatter.error(`${error.message}\nUsage: ${usage}`);
  }

  process.exit(ExitCode.VALIDATION_ERROR);
}

/**
 * Creates a formatted config error and exits.
 */
export function exitWithConfigError(
  missingKey: "apiToken" | "organizationId" | "userId",
  formatter: OutputFormatter,
): never {
  const errorMap = {
    apiToken: ConfigError.missingToken,
    organizationId: ConfigError.missingOrganizationId,
    userId: ConfigError.missingUserId,
  };

  const error = errorMap[missingKey]();
  handleError(error, formatter);

  // This is unreachable, but TypeScript needs it
  throw error;
}
