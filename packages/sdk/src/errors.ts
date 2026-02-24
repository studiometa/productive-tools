import { ProductiveApiError } from '@studiometa/productive-api';

// Base error
export class ProductiveError extends Error {
  readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ProductiveError';
    this.statusCode = statusCode;
  }
}

// 404
export class ResourceNotFoundError extends ProductiveError {
  readonly resourceType?: string;
  readonly resourceId?: string;
  constructor(message: string, resourceType?: string, resourceId?: string) {
    super(message, 404);
    this.name = 'ResourceNotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

// 429
export class RateLimitError extends ProductiveError {
  readonly retryAfter?: number;
  constructor(message: string, retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// 422
export class ValidationError extends ProductiveError {
  readonly fieldErrors: Array<{ field: string; message: string }>;
  constructor(message: string, fieldErrors: Array<{ field: string; message: string }> = []) {
    super(message, 422);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

// 401, 403
export class AuthenticationError extends ProductiveError {
  constructor(message: string, statusCode: number = 401) {
    super(message, statusCode);
    this.name = 'AuthenticationError';
  }
}

// fetch/network failures
export class NetworkError extends ProductiveError {
  override readonly cause: Error;
  constructor(message: string, cause: Error) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * Parse JSON:API 422 validation errors from a response string.
 */
function parseValidationErrors(response: unknown): Array<{ field: string; message: string }> {
  if (typeof response !== 'string' || !response) {
    return [];
  }
  try {
    const parsed = JSON.parse(response) as unknown;
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'errors' in parsed &&
      Array.isArray((parsed as { errors: unknown }).errors)
    ) {
      const errors = (parsed as { errors: unknown[] }).errors;
      return errors.map((entry: unknown) => {
        const e = entry as {
          detail?: string;
          source?: { pointer?: string };
        };
        const detail = e.detail ?? 'Validation failed';
        const pointer = e.source?.pointer ?? '';
        // Convert "/data/attributes/title" → "title"
        const field = pointer.split('/').pop() ?? pointer;
        return { field, message: detail };
      });
    }
  } catch {
    // not valid JSON — return empty
  }
  return [];
}

/**
 * Maps any thrown value to a typed `ProductiveError` subclass.
 */
export function wrapError(error: unknown): ProductiveError {
  // Network/fetch errors (TypeError from fetch)
  if (error instanceof TypeError) {
    return new NetworkError(error.message, error);
  }

  // ProductiveApiError from the API client
  if (error instanceof ProductiveApiError) {
    const statusCode: number | undefined = error.statusCode;
    const message: string = error.message;
    const response: unknown = error.response;

    if (statusCode === 404) {
      return new ResourceNotFoundError(message);
    }

    if (statusCode === 429) {
      // Try to parse retry-after from JSON response
      let retryAfter: number | undefined;
      if (typeof response === 'string' && response) {
        try {
          const parsed = JSON.parse(response) as unknown;
          if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'retry_after' in parsed &&
            typeof (parsed as { retry_after: unknown }).retry_after === 'number'
          ) {
            retryAfter = (parsed as { retry_after: number }).retry_after;
          }
        } catch {
          // not JSON, ignore
        }
      }
      return new RateLimitError(message, retryAfter);
    }

    if (statusCode === 422) {
      const fieldErrors = parseValidationErrors(response);
      return new ValidationError(message, fieldErrors);
    }

    if (statusCode === 401 || statusCode === 403) {
      return new AuthenticationError(message, statusCode);
    }

    // Other API errors
    return new ProductiveError(message, statusCode);
  }

  // Generic Error
  if (error instanceof Error) {
    return new ProductiveError(error.message);
  }

  // Non-Error values
  return new ProductiveError(String(error));
}
