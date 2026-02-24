import { ProductiveApiError } from '@studiometa/productive-api';
import { describe, expect, it } from 'vitest';

import {
  AuthenticationError,
  NetworkError,
  ProductiveError,
  RateLimitError,
  ResourceNotFoundError,
  ValidationError,
  wrapError,
} from './errors.js';

// ─────────────────────────────────────────────────────────────
// Error class construction & properties
// ─────────────────────────────────────────────────────────────

describe('ProductiveError', () => {
  it('sets message, name and statusCode', () => {
    const err = new ProductiveError('something failed', 500);
    expect(err.message).toBe('something failed');
    expect(err.name).toBe('ProductiveError');
    expect(err.statusCode).toBe(500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProductiveError);
  });

  it('statusCode is optional', () => {
    const err = new ProductiveError('no code');
    expect(err.statusCode).toBeUndefined();
  });
});

describe('ResourceNotFoundError', () => {
  it('sets name, statusCode, resourceType, resourceId', () => {
    const err = new ResourceNotFoundError('not found', 'tasks', '42');
    expect(err.name).toBe('ResourceNotFoundError');
    expect(err.statusCode).toBe(404);
    expect(err.resourceType).toBe('tasks');
    expect(err.resourceId).toBe('42');
    expect(err.message).toBe('not found');
  });

  it('extends ProductiveError', () => {
    const err = new ResourceNotFoundError('not found');
    expect(err).toBeInstanceOf(ProductiveError);
    expect(err).toBeInstanceOf(ResourceNotFoundError);
  });

  it('resourceType and resourceId are optional', () => {
    const err = new ResourceNotFoundError('not found');
    expect(err.resourceType).toBeUndefined();
    expect(err.resourceId).toBeUndefined();
  });
});

describe('RateLimitError', () => {
  it('sets name, statusCode, retryAfter', () => {
    const err = new RateLimitError('rate limited', 30);
    expect(err.name).toBe('RateLimitError');
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(30);
    expect(err.message).toBe('rate limited');
  });

  it('extends ProductiveError', () => {
    const err = new RateLimitError('rate limited');
    expect(err).toBeInstanceOf(ProductiveError);
    expect(err).toBeInstanceOf(RateLimitError);
  });

  it('retryAfter is optional', () => {
    const err = new RateLimitError('rate limited');
    expect(err.retryAfter).toBeUndefined();
  });
});

describe('ValidationError', () => {
  it('sets name, statusCode, fieldErrors', () => {
    const fieldErrors = [{ field: 'title', message: 'is required' }];
    const err = new ValidationError('validation failed', fieldErrors);
    expect(err.name).toBe('ValidationError');
    expect(err.statusCode).toBe(422);
    expect(err.fieldErrors).toEqual(fieldErrors);
    expect(err.message).toBe('validation failed');
  });

  it('extends ProductiveError', () => {
    const err = new ValidationError('validation failed');
    expect(err).toBeInstanceOf(ProductiveError);
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('defaults fieldErrors to empty array', () => {
    const err = new ValidationError('validation failed');
    expect(err.fieldErrors).toEqual([]);
  });
});

describe('AuthenticationError', () => {
  it('sets name, statusCode', () => {
    const err = new AuthenticationError('unauthorized');
    expect(err.name).toBe('AuthenticationError');
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('unauthorized');
  });

  it('accepts custom statusCode (403)', () => {
    const err = new AuthenticationError('forbidden', 403);
    expect(err.statusCode).toBe(403);
  });

  it('extends ProductiveError', () => {
    const err = new AuthenticationError('unauthorized');
    expect(err).toBeInstanceOf(ProductiveError);
    expect(err).toBeInstanceOf(AuthenticationError);
  });
});

describe('NetworkError', () => {
  it('sets name, message, cause', () => {
    const cause = new TypeError('fetch failed');
    const err = new NetworkError('network error', cause);
    expect(err.name).toBe('NetworkError');
    expect(err.message).toBe('network error');
    expect(err.cause).toBe(cause);
    expect(err.statusCode).toBeUndefined();
  });

  it('extends ProductiveError', () => {
    const err = new NetworkError('network error', new TypeError('x'));
    expect(err).toBeInstanceOf(ProductiveError);
    expect(err).toBeInstanceOf(NetworkError);
  });
});

// ─────────────────────────────────────────────────────────────
// wrapError()
// ─────────────────────────────────────────────────────────────

describe('wrapError()', () => {
  it('wraps ProductiveApiError 404 → ResourceNotFoundError', () => {
    const apiError = new ProductiveApiError('Not found', 404, '');
    const result = wrapError(apiError);
    expect(result).toBeInstanceOf(ResourceNotFoundError);
    expect(result.statusCode).toBe(404);
    expect(result.message).toBe('Not found');
  });

  it('wraps ProductiveApiError 429 → RateLimitError', () => {
    const apiError = new ProductiveApiError('Rate limited', 429, '');
    const result = wrapError(apiError);
    expect(result).toBeInstanceOf(RateLimitError);
    expect(result.statusCode).toBe(429);
  });

  it('parses retryAfter from JSON response on 429', () => {
    const response = JSON.stringify({ retry_after: 60 });
    const apiError = new ProductiveApiError('Rate limited', 429, response);
    const result = wrapError(apiError) as RateLimitError;
    expect(result).toBeInstanceOf(RateLimitError);
    expect(result.retryAfter).toBe(60);
  });

  it('retryAfter is undefined when response has no retry_after field', () => {
    const apiError = new ProductiveApiError('Rate limited', 429, '{}');
    const result = wrapError(apiError) as RateLimitError;
    expect(result).toBeInstanceOf(RateLimitError);
    expect(result.retryAfter).toBeUndefined();
  });

  it('wraps ProductiveApiError 422 → ValidationError with fieldErrors', () => {
    const response = JSON.stringify({
      errors: [
        { detail: 'is required', source: { pointer: '/data/attributes/title' } },
        { detail: 'is too short', source: { pointer: '/data/attributes/name' } },
      ],
    });
    const apiError = new ProductiveApiError('Unprocessable entity', 422, response);
    const result = wrapError(apiError) as ValidationError;
    expect(result).toBeInstanceOf(ValidationError);
    expect(result.statusCode).toBe(422);
    expect(result.fieldErrors).toEqual([
      { field: 'title', message: 'is required' },
      { field: 'name', message: 'is too short' },
    ]);
  });

  it('422 with missing errors array → empty fieldErrors', () => {
    const apiError = new ProductiveApiError('Unprocessable entity', 422, '{"data": {}}');
    const result = wrapError(apiError) as ValidationError;
    expect(result).toBeInstanceOf(ValidationError);
    expect(result.fieldErrors).toEqual([]);
  });

  it('422 with invalid JSON response → empty fieldErrors', () => {
    const apiError = new ProductiveApiError('Unprocessable entity', 422, 'not json');
    const result = wrapError(apiError) as ValidationError;
    expect(result).toBeInstanceOf(ValidationError);
    expect(result.fieldErrors).toEqual([]);
  });

  it('422 with empty/undefined response → empty fieldErrors', () => {
    const apiError = new ProductiveApiError('Unprocessable entity', 422, '');
    const result = wrapError(apiError) as ValidationError;
    expect(result).toBeInstanceOf(ValidationError);
    expect(result.fieldErrors).toEqual([]);
  });

  it('422 errors without source.pointer uses empty string as field', () => {
    const response = JSON.stringify({
      errors: [{ detail: 'something went wrong' }],
    });
    const apiError = new ProductiveApiError('Unprocessable entity', 422, response);
    const result = wrapError(apiError) as ValidationError;
    expect(result).toBeInstanceOf(ValidationError);
    expect(result.fieldErrors).toEqual([{ field: '', message: 'something went wrong' }]);
  });

  it('wraps ProductiveApiError 401 → AuthenticationError with statusCode 401', () => {
    const apiError = new ProductiveApiError('Unauthorized', 401, '');
    const result = wrapError(apiError);
    expect(result).toBeInstanceOf(AuthenticationError);
    expect(result.statusCode).toBe(401);
  });

  it('wraps ProductiveApiError 403 → AuthenticationError with statusCode 403', () => {
    const apiError = new ProductiveApiError('Forbidden', 403, '');
    const result = wrapError(apiError);
    expect(result).toBeInstanceOf(AuthenticationError);
    expect(result.statusCode).toBe(403);
  });

  it('wraps TypeError (network error) → NetworkError', () => {
    const typeError = new TypeError('fetch failed');
    const result = wrapError(typeError);
    expect(result).toBeInstanceOf(NetworkError);
    expect((result as NetworkError).cause).toBe(typeError);
    expect(result.message).toBe('fetch failed');
    expect(result.statusCode).toBeUndefined();
  });

  it('wraps unknown ProductiveApiError status → ProductiveError', () => {
    const apiError = new ProductiveApiError('Server error', 503, '');
    const result = wrapError(apiError);
    expect(result).toBeInstanceOf(ProductiveError);
    expect(result).not.toBeInstanceOf(ResourceNotFoundError);
    expect(result).not.toBeInstanceOf(RateLimitError);
    expect(result).not.toBeInstanceOf(ValidationError);
    expect(result).not.toBeInstanceOf(AuthenticationError);
    expect(result.statusCode).toBe(503);
  });

  it('wraps generic Error → ProductiveError', () => {
    const error = new Error('generic error');
    const result = wrapError(error);
    expect(result).toBeInstanceOf(ProductiveError);
    expect(result.message).toBe('generic error');
    expect(result.statusCode).toBeUndefined();
  });

  it('wraps non-Error string → ProductiveError with stringified message', () => {
    const result = wrapError('something went wrong');
    expect(result).toBeInstanceOf(ProductiveError);
    expect(result.message).toBe('something went wrong');
  });

  it('wraps non-Error object → ProductiveError with stringified message', () => {
    const result = wrapError({ code: 'OOPS' });
    expect(result).toBeInstanceOf(ProductiveError);
    expect(result.message).toBe('[object Object]');
  });

  it('instanceof chain: ResourceNotFoundError instanceof ProductiveError', () => {
    const err = new ResourceNotFoundError('not found');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProductiveError);
    expect(err).toBeInstanceOf(ResourceNotFoundError);
  });
});
