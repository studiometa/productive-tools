import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  flatMap,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  tryCatch,
  tryCatchSync,
  combine,
  combineAsync,
  combineParallel,
  match,
  type Result,
} from '../result.js';

describe('Result type', () => {
  describe('ok and err constructors', () => {
    it('should create Ok result', () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should create Err result', () => {
      const error = new Error('test error');
      const result = err(error);
      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe('isOk and isErr type guards', () => {
    it('should correctly identify Ok', () => {
      const result = ok(42);
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
    });

    it('should correctly identify Err', () => {
      const result = err(new Error('test'));
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('map', () => {
    it('should transform Ok value', () => {
      const result = ok(10);
      const mapped = map(result, (x) => x * 2);
      expect(isOk(mapped) && mapped.value).toBe(20);
    });

    it('should not transform Err', () => {
      const error = new Error('test');
      const result = err<Error, number>(error);
      const mapped = map(result, (x) => x * 2);
      expect(isErr(mapped) && mapped.error).toBe(error);
    });
  });

  describe('mapErr', () => {
    it('should transform Err value', () => {
      const result = err<Error, number>(new Error('original'));
      const mapped = mapErr(result, (e) => new Error(`wrapped: ${e.message}`));
      expect(isErr(mapped) && mapped.error.message).toBe('wrapped: original');
    });

    it('should not transform Ok', () => {
      const result = ok<Error, number>(42);
      const mapped = mapErr(result, (e) => new Error(`wrapped: ${e.message}`));
      expect(isOk(mapped) && mapped.value).toBe(42);
    });
  });

  describe('flatMap', () => {
    it('should chain Ok operations', () => {
      const divide = (a: number, b: number): Result<Error, number> => {
        if (b === 0) return err(new Error('division by zero'));
        return ok(a / b);
      };

      const result = flatMap(ok(10), (x) => divide(x, 2));
      expect(isOk(result) && result.value).toBe(5);
    });

    it('should short-circuit on Err', () => {
      const error = new Error('first error');
      const result = flatMap(err<Error, number>(error), (x) => ok(x * 2));
      expect(isErr(result) && result.error).toBe(error);
    });

    it('should propagate Err from function', () => {
      const result = flatMap(ok(10), () => err<Error, number>(new Error('second error')));
      expect(isErr(result) && result.error.message).toBe('second error');
    });
  });

  describe('unwrap', () => {
    it('should return value for Ok', () => {
      expect(unwrap(ok(42))).toBe(42);
    });

    it('should throw for Err', () => {
      const error = new Error('test error');
      expect(() => unwrap(err(error))).toThrow('test error');
    });
  });

  describe('unwrapOr', () => {
    it('should return value for Ok', () => {
      expect(unwrapOr(ok(42), 0)).toBe(42);
    });

    it('should return default for Err', () => {
      expect(unwrapOr(err(new Error('test')), 0)).toBe(0);
    });
  });

  describe('unwrapOrElse', () => {
    it('should return value for Ok', () => {
      expect(unwrapOrElse(ok(42), () => 0)).toBe(42);
    });

    it('should compute default from error for Err', () => {
      const result = err(new Error('test'));
      expect(unwrapOrElse(result, (e) => e.message.length)).toBe(4);
    });
  });

  describe('tryCatch', () => {
    it('should return Ok for successful async operation', async () => {
      const result = await tryCatch(
        async () => 42,
        (e) => new Error(String(e))
      );
      expect(isOk(result) && result.value).toBe(42);
    });

    it('should return Err for failed async operation', async () => {
      const result = await tryCatch(
        async () => {
          throw new Error('async error');
        },
        (e) => e as Error
      );
      expect(isErr(result) && result.error.message).toBe('async error');
    });

    it('should map error correctly', async () => {
      const result = await tryCatch(
        async () => {
          throw new Error('original');
        },
        (e) => new Error(`wrapped: ${(e as Error).message}`)
      );
      expect(isErr(result) && result.error.message).toBe('wrapped: original');
    });
  });

  describe('tryCatchSync', () => {
    it('should return Ok for successful sync operation', () => {
      const result = tryCatchSync(
        () => 42,
        (e) => new Error(String(e))
      );
      expect(isOk(result) && result.value).toBe(42);
    });

    it('should return Err for failed sync operation', () => {
      const result = tryCatchSync(
        () => {
          throw new Error('sync error');
        },
        (e) => e as Error
      );
      expect(isErr(result) && result.error.message).toBe('sync error');
    });
  });

  describe('combine', () => {
    it('should combine all Ok results', () => {
      const results = [ok(1), ok(2), ok(3)];
      const combined = combine(results);
      expect(isOk(combined) && combined.value).toEqual([1, 2, 3]);
    });

    it('should return first Err', () => {
      const error = new Error('first error');
      const results = [ok(1), err(error), ok(3)];
      const combined = combine(results);
      expect(isErr(combined) && combined.error).toBe(error);
    });

    it('should return empty array for empty input', () => {
      const combined = combine([]);
      expect(isOk(combined) && combined.value).toEqual([]);
    });
  });

  describe('combineAsync', () => {
    it('should combine all successful async operations', async () => {
      const operations = [
        async () => ok(1),
        async () => ok(2),
        async () => ok(3),
      ];
      const combined = await combineAsync(operations);
      expect(isOk(combined) && combined.value).toEqual([1, 2, 3]);
    });

    it('should return first Err', async () => {
      const error = new Error('async error');
      const operations = [
        async () => ok(1),
        async () => err<Error, number>(error),
        async () => ok(3),
      ];
      const combined = await combineAsync(operations);
      expect(isErr(combined) && combined.error).toBe(error);
    });
  });

  describe('combineParallel', () => {
    it('should combine all successful parallel operations', async () => {
      const operations = [
        async () => ok(1),
        async () => ok(2),
        async () => ok(3),
      ];
      const combined = await combineParallel(operations);
      expect(isOk(combined) && combined.value).toEqual([1, 2, 3]);
    });

    it('should return an Err if any fails', async () => {
      const error = new Error('parallel error');
      const operations = [
        async () => ok(1),
        async () => err<Error, number>(error),
        async () => ok(3),
      ];
      const combined = await combineParallel(operations);
      expect(isErr(combined)).toBe(true);
    });
  });

  describe('match', () => {
    it('should call ok handler for Ok', () => {
      const result = ok(42);
      const output = match(result, {
        ok: (value) => `success: ${value}`,
        err: (error) => `error: ${error.message}`,
      });
      expect(output).toBe('success: 42');
    });

    it('should call err handler for Err', () => {
      const result = err(new Error('test'));
      const output = match(result, {
        ok: (value) => `success: ${value}`,
        err: (error) => `error: ${error.message}`,
      });
      expect(output).toBe('error: test');
    });
  });
});
