/**
 * Result type for typed error handling without Effect-TS.
 *
 * This provides a lightweight alternative to try-catch that:
 * - Makes error types explicit in function signatures
 * - Enables composition of fallible operations
 * - Separates error handling from business logic
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<DivisionError, number> {
 *   if (b === 0) return err(new DivisionError('Cannot divide by zero'));
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.ok) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */

/**
 * Represents a successful result containing a value
 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/**
 * Represents a failed result containing an error
 */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/**
 * A Result is either Ok with a value or Err with an error.
 * The error type E should be a specific error class, not unknown.
 */
export type Result<E, T> = Ok<T> | Err<E>;

/**
 * Creates a successful Result
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Creates a failed Result
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * Type guard to check if a Result is Ok
 */
export function isOk<E, T>(result: Result<E, T>): result is Ok<T> {
  return result.ok;
}

/**
 * Type guard to check if a Result is Err
 */
export function isErr<E, T>(result: Result<E, T>): result is Err<E> {
  return !result.ok;
}

/**
 * Maps a function over the value in Ok, leaving Err unchanged
 */
export function map<E, T, U>(result: Result<E, T>, fn: (value: T) => U): Result<E, U> {
  if (result.ok) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Maps a function over the error in Err, leaving Ok unchanged
 */
export function mapErr<E, T, F>(result: Result<E, T>, fn: (error: E) => F): Result<F, T> {
  if (!result.ok) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chains Result-returning functions together (flatMap/bind)
 */
export function flatMap<E, T, U>(
  result: Result<E, T>,
  fn: (value: T) => Result<E, U>,
): Result<E, U> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/**
 * Unwraps a Result, returning the value or throwing the error
 */
export function unwrap<E extends Error, T>(result: Result<E, T>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwraps a Result, returning the value or a default
 */
export function unwrapOr<E, T>(result: Result<E, T>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Unwraps a Result, returning the value or computing a default from the error
 */
export function unwrapOrElse<E, T>(result: Result<E, T>, fn: (error: E) => T): T {
  if (result.ok) {
    return result.value;
  }
  return fn(result.error);
}

/**
 * Wraps a Promise in a Result, catching any thrown errors
 *
 * @example
 * ```typescript
 * const result = await tryCatch(
 *   () => fetch('/api/data'),
 *   (error) => new NetworkError('Failed to fetch', { cause: error })
 * );
 * ```
 */
export async function tryCatch<E, T>(
  fn: () => Promise<T>,
  mapError: (error: unknown) => E,
): Promise<Result<E, T>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(mapError(error));
  }
}

/**
 * Synchronous version of tryCatch
 */
export function tryCatchSync<E, T>(fn: () => T, mapError: (error: unknown) => E): Result<E, T> {
  try {
    const value = fn();
    return ok(value);
  } catch (error) {
    return err(mapError(error));
  }
}

/**
 * Combines multiple Results into a single Result containing an array.
 * Returns the first error encountered, or Ok with all values.
 *
 * @example
 * ```typescript
 * const results = combine([ok(1), ok(2), ok(3)]);
 * // { ok: true, value: [1, 2, 3] }
 *
 * const withError = combine([ok(1), err(new Error('fail')), ok(3)]);
 * // { ok: false, error: Error('fail') }
 * ```
 */
export function combine<E, T>(results: Result<E, T>[]): Result<E, T[]> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
}

/**
 * Executes multiple async operations and combines their results.
 * Stops at the first error encountered.
 */
export async function combineAsync<E, T>(
  operations: (() => Promise<Result<E, T>>)[],
): Promise<Result<E, T[]>> {
  const values: T[] = [];

  for (const operation of operations) {
    const result = await operation();
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
}

/**
 * Executes multiple async operations in parallel and combines their results.
 * Returns the first error encountered (order not guaranteed).
 */
export async function combineParallel<E, T>(
  operations: (() => Promise<Result<E, T>>)[],
): Promise<Result<E, T[]>> {
  const results = await Promise.all(operations.map((op) => op()));
  return combine(results);
}

/**
 * Pattern matching for Result types
 *
 * @example
 * ```typescript
 * const message = match(result, {
 *   ok: (value) => `Success: ${value}`,
 *   err: (error) => `Error: ${error.message}`,
 * });
 * ```
 */
export function match<E, T, U>(
  result: Result<E, T>,
  handlers: {
    ok: (value: T) => U;
    err: (error: E) => U;
  },
): U {
  if (result.ok) {
    return handlers.ok(result.value);
  }
  return handlers.err(result.error);
}
