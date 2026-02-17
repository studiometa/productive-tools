/**
 * Shared executor error types.
 */

/**
 * Validation error for executor input.
 * Thrown when required fields are missing or invalid.
 */
export class ExecutorValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = 'ExecutorValidationError';
  }
}
