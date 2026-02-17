import { describe, expect, it } from 'vitest';

import { ProductiveApiError } from './error.js';

describe('ProductiveApiError', () => {
  it('creates error with message only', () => {
    const error = new ProductiveApiError('test error');
    expect(error.message).toBe('test error');
    expect(error.name).toBe('ProductiveApiError');
    expect(error.statusCode).toBeUndefined();
    expect(error.response).toBeUndefined();
  });

  it('creates error with status code', () => {
    const error = new ProductiveApiError('not found', 404);
    expect(error.statusCode).toBe(404);
  });

  it('creates error with response body', () => {
    const error = new ProductiveApiError('bad request', 400, '{"errors":[]}');
    expect(error.response).toBe('{"errors":[]}');
  });

  it('serializes to JSON', () => {
    const error = new ProductiveApiError('unauthorized', 401, 'body');
    const json = error.toJSON();
    expect(json).toEqual({
      error: 'ProductiveApiError',
      message: 'unauthorized',
      statusCode: 401,
      response: 'body',
    });
  });

  it('is an instance of Error', () => {
    const error = new ProductiveApiError('test');
    expect(error).toBeInstanceOf(Error);
  });
});
