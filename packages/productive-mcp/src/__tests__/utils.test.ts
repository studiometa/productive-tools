import { describe, it, expect } from 'vitest';

import { UserInputError } from '../errors.js';
import {
  jsonResult,
  errorResult,
  inputErrorResult,
  formatError,
  toStringFilter,
} from '../handlers/utils.js';

describe('handlers/utils', () => {
  describe('jsonResult', () => {
    it('should create a successful JSON response', () => {
      const result = jsonResult({ foo: 'bar' });
      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text as string)).toEqual({ foo: 'bar' });
    });
  });

  describe('errorResult', () => {
    it('should create an error response', () => {
      const result = errorResult('Something went wrong');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('**Error:** Something went wrong');
    });
  });

  describe('inputErrorResult', () => {
    it('should create an error response from UserInputError', () => {
      const error = new UserInputError('Missing field', ['Provide the field']);
      const result = inputErrorResult(error);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('**Input Error:**');
      expect(result.content[0].text).toContain('Missing field');
      expect(result.content[0].text).toContain('**Hints:**');
    });
  });

  describe('formatError', () => {
    it('should format UserInputError with hints', () => {
      const error = new UserInputError('Test error', ['Hint 1', 'Hint 2']);
      const result = formatError(error);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('**Input Error:**');
      expect(result.content[0].text).toContain('Hint 1');
    });

    it('should format regular Error', () => {
      const error = new Error('Regular error');
      const result = formatError(error);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('**Error:** Regular error');
    });

    it('should format string error', () => {
      const result = formatError('String error');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('**Error:** String error');
    });

    it('should handle null/undefined', () => {
      const result = formatError(null);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('**Error:** null');
    });
  });

  describe('toStringFilter', () => {
    it('should convert object values to strings', () => {
      const result = toStringFilter({ a: 1, b: true, c: 'test' });
      expect(result).toEqual({ a: '1', b: 'true', c: 'test' });
    });

    it('should filter out null and undefined values', () => {
      const result = toStringFilter({ a: 'test', b: null, c: undefined });
      expect(result).toEqual({ a: 'test' });
    });

    it('should return undefined for empty filter', () => {
      const result = toStringFilter({ a: null, b: undefined });
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      const result = toStringFilter(undefined);
      expect(result).toBeUndefined();
    });
  });
});
