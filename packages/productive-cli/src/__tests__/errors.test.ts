import { describe, it, expect } from 'vitest';

import {
  ConfigError,
  ValidationError,
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  CacheError,
  CommandError,
  isCliError,
  isApiError,
  isRecoverable,
  fromLegacyError,
} from '../errors.js';

describe('Error classes', () => {
  describe('Hints support', () => {
    it('should include hints in ValidationError', () => {
      const error = ValidationError.required('service', [
        'Find services using: productive services list',
      ]);
      expect(error.hints).toContain('Find services using: productive services list');
    });

    it('should include hints in ConfigError static methods', () => {
      const error = ConfigError.missingToken();
      expect(error.hints).toBeDefined();
      expect(error.hints?.length).toBeGreaterThan(0);
      expect(error.hints).toContain('Set via CLI flag: --token <token>');
    });

    it('should include hints in JSON output', () => {
      const error = ValidationError.required('field', ['Hint 1', 'Hint 2']);
      const json = error.toJSON();
      expect(json.hints).toEqual(['Hint 1', 'Hint 2']);
    });

    it('should not include hints in JSON when empty', () => {
      const error = new ValidationError('Error without hints', 'field');
      const json = error.toJSON();
      expect(json.hints).toBeUndefined();
    });

    it('should format message with hints using toFormattedMessage', () => {
      const error = ValidationError.required('field', ['Try this', 'Or this']);
      const formatted = error.toFormattedMessage();
      expect(formatted).toContain('field is required');
      expect(formatted).toContain('Hints:');
      expect(formatted).toContain('• Try this');
      expect(formatted).toContain('• Or this');
    });

    it('should return plain message when no hints', () => {
      const error = new ValidationError('Simple error');
      const formatted = error.toFormattedMessage();
      expect(formatted).toBe('Simple error');
      expect(formatted).not.toContain('Hints:');
    });

    it('should auto-generate hints for API errors based on status code', () => {
      const error401 = new ApiError('Unauthorized', 401);
      expect(error401.hints).toContain('Check that your API token is valid and not expired');

      const error403 = new ApiError('Forbidden', 403);
      expect(error403.hints).toContain('You may not have permission to access this resource');

      const error404 = new ApiError('Not found', 404);
      expect(error404.hints).toContain("Use 'list' command to find valid resource IDs");

      const error422 = new ApiError('Unprocessable', 422);
      expect(error422.hints).toContain('The request data may be invalid');
      expect(error422.hints).toContain('Run command with --help for field documentation');

      const error429 = new ApiError('Rate limited', 429);
      expect(error429.hints).toContain('Too many requests - wait before retrying');

      const error500 = new ApiError('Server error', 500);
      expect(error500.hints).toContain('This is a server error - try again later');

      const error502 = new ApiError('Bad gateway', 502);
      expect(error502.hints).toContain('If the issue persists, contact support');

      // No hints for unknown status codes
      const error418 = new ApiError('Teapot', 418);
      expect(error418.hints).toEqual([]);
    });
  });

  describe('ConfigError', () => {
    it('should create with message and missing keys', () => {
      const error = new ConfigError('Missing config', ['apiToken', 'orgId']);
      expect(error.message).toBe('Missing config');
      expect(error.missingKeys).toEqual(['apiToken', 'orgId']);
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.isRecoverable).toBe(true);
    });

    it('should create missingToken error', () => {
      const error = ConfigError.missingToken();
      expect(error.message).toContain('API token not configured');
      expect(error.missingKeys).toEqual(['apiToken']);
    });

    it('should create missingOrganizationId error', () => {
      const error = ConfigError.missingOrganizationId();
      expect(error.message).toContain('Organization ID not configured');
      expect(error.missingKeys).toEqual(['organizationId']);
    });

    it('should create missingUserId error', () => {
      const error = ConfigError.missingUserId();
      expect(error.message).toContain('User ID not configured');
      expect(error.missingKeys).toEqual(['userId']);
    });

    it('should serialize to JSON with missing keys', () => {
      const error = new ConfigError('Missing config', ['apiToken']);
      const json = error.toJSON();
      expect(json.error).toBe('CONFIG_ERROR');
      expect(json.message).toBe('Missing config');
      expect(json.missingKeys).toEqual(['apiToken']);
    });

    it('should create invalid config error with hints', () => {
      const error = ConfigError.invalid('apiToken', 'must not be empty');
      expect(error.message).toBe("Invalid configuration for 'apiToken': must not be empty");
      expect(error.missingKeys).toEqual(['apiToken']);
      expect(error.hints).toContain("Check the value of 'apiToken' in your config");
      expect(error.hints).toContain('Run: productive config get to see current values');
    });
  });

  describe('ValidationError', () => {
    it('should create with message, field, and value', () => {
      const error = new ValidationError('Invalid input', 'email', 'not-an-email');
      expect(error.message).toBe('Invalid input');
      expect(error.field).toBe('email');
      expect(error.value).toBe('not-an-email');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.isRecoverable).toBe(true);
    });

    it('should create required field error', () => {
      const error = ValidationError.required('service');
      expect(error.message).toBe('service is required');
      expect(error.field).toBe('service');
    });

    it('should create invalid field error', () => {
      const error = ValidationError.invalid('time', -5, 'must be positive');
      expect(error.message).toBe('Invalid time: must be positive');
      expect(error.field).toBe('time');
      expect(error.value).toBe(-5);
    });

    it('should create invalid date error', () => {
      const error = ValidationError.invalidDate('not-a-date');
      expect(error.message).toContain('Invalid date format');
      expect(error.field).toBe('date');
      expect(error.value).toBe('not-a-date');
    });

    it('should create invalid ID error', () => {
      const error = ValidationError.invalidId('project', 'abc');
      expect(error.message).toContain('Invalid project');
      expect(error.field).toBe('project');
    });
  });

  describe('ApiError', () => {
    it('should create with status code and endpoint', () => {
      const error = new ApiError('Request failed', 500, '/projects', 'raw response');
      expect(error.message).toBe('Request failed');
      expect(error.statusCode).toBe(500);
      expect(error.endpoint).toBe('/projects');
      expect(error.response).toBe('raw response');
      expect(error.code).toBe('API_ERROR');
    });

    it('should be recoverable for 5xx errors', () => {
      expect(new ApiError('Server error', 500).isRecoverable).toBe(true);
      expect(new ApiError('Server error', 502).isRecoverable).toBe(true);
      expect(new ApiError('Server error', 503).isRecoverable).toBe(true);
    });

    it('should not be recoverable for 4xx errors', () => {
      expect(new ApiError('Client error', 400).isRecoverable).toBe(false);
      expect(new ApiError('Client error', 404).isRecoverable).toBe(false);
    });

    it('should be recoverable for network errors (no status)', () => {
      expect(new ApiError('Network error', undefined).isRecoverable).toBe(true);
    });

    it('should create appropriate error subclass from status code', () => {
      expect(ApiError.fromResponse(401, 'Unauthorized')).toBeInstanceOf(AuthenticationError);
      expect(ApiError.fromResponse(403, 'Forbidden')).toBeInstanceOf(AuthorizationError);
      expect(ApiError.fromResponse(404, 'Not found')).toBeInstanceOf(NotFoundError);
      expect(ApiError.fromResponse(429, 'Too many requests')).toBeInstanceOf(RateLimitError);
      expect(ApiError.fromResponse(500, 'Server error')).toBeInstanceOf(ServerError);
      expect(ApiError.fromResponse(400, 'Bad request')).toBeInstanceOf(ApiError);
    });

    it('should create network error', () => {
      const cause = new Error('Connection refused');
      const error = ApiError.networkError('/projects', cause);
      expect(error.message).toContain('Network error');
      expect(error.message).toContain('/projects');
      expect(error.endpoint).toBe('/projects');
      expect(error.cause).toBe(cause);
    });
  });

  describe('AuthenticationError', () => {
    it('should have correct code and not be recoverable', () => {
      const error = new AuthenticationError('Invalid token');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.isRecoverable).toBe(false);
    });

    it('should use default message if none provided', () => {
      const error = new AuthenticationError('');
      expect(error.message).toContain('Authentication failed');
    });
  });

  describe('AuthorizationError', () => {
    it('should have correct code and not be recoverable', () => {
      const error = new AuthorizationError('Access denied');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.isRecoverable).toBe(false);
    });
  });

  describe('NotFoundError', () => {
    it('should have correct code and not be recoverable', () => {
      const error = new NotFoundError('Project not found');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.statusCode).toBe(404);
      expect(error.isRecoverable).toBe(false);
    });
  });

  describe('RateLimitError', () => {
    it('should have correct code and be recoverable', () => {
      const error = new RateLimitError('Too many requests', '/projects', null, 60);
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.isRecoverable).toBe(true);
      expect(error.retryAfter).toBe(60);
    });

    it('should include retryAfter in JSON', () => {
      const error = new RateLimitError('Too many requests', '/projects', null, 30);
      const json = error.toJSON();
      expect(json.retryAfter).toBe(30);
    });
  });

  describe('ServerError', () => {
    it('should have correct code and be recoverable', () => {
      const error = new ServerError('Internal error', 500);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.isRecoverable).toBe(true);
    });

    it('should accept different 5xx status codes', () => {
      expect(new ServerError('Bad gateway', 502).statusCode).toBe(502);
      expect(new ServerError('Service unavailable', 503).statusCode).toBe(503);
    });
  });

  describe('CacheError', () => {
    it('should create with operation', () => {
      const error = new CacheError('Cache read failed', 'read');
      expect(error.message).toBe('Cache read failed');
      expect(error.operation).toBe('read');
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.isRecoverable).toBe(true);
    });

    it('should create with hints', () => {
      const error = new CacheError('Cache error', 'read', ['Try this']);
      expect(error.hints).toEqual(['Try this']);
    });

    it('should serialize to JSON with operation', () => {
      const error = new CacheError('Cache error', 'write', ['Hint']);
      const json = error.toJSON();
      expect(json.operation).toBe('write');
      expect(json.hints).toEqual(['Hint']);
    });

    it('should create read/write/invalidate errors with hints', () => {
      const readError = CacheError.readFailed(new Error('test'));
      expect(readError.operation).toBe('read');
      expect(readError.hints).toContain('Try running with --no-cache to bypass cache');

      const writeError = CacheError.writeFailed(new Error('test'));
      expect(writeError.operation).toBe('write');
      expect(writeError.hints).toContain('Check disk space and permissions');

      const invalidateError = CacheError.invalidateFailed(new Error('test'));
      expect(invalidateError.operation).toBe('invalidate');
      expect(invalidateError.hints).toContain('Try running: productive cache clear');
    });
  });

  describe('CommandError', () => {
    it('should create with command and subcommand', () => {
      const error = new CommandError('Unknown subcommand', 'time', 'foo');
      expect(error.message).toBe('Unknown subcommand');
      expect(error.command).toBe('time');
      expect(error.subcommand).toBe('foo');
      expect(error.code).toBe('COMMAND_ERROR');
      expect(error.isRecoverable).toBe(false);
    });

    it('should create with hints', () => {
      const error = new CommandError('Test error', 'cmd', 'sub', ['Hint 1', 'Hint 2']);
      expect(error.hints).toEqual(['Hint 1', 'Hint 2']);
    });

    it('should serialize to JSON with command and subcommand', () => {
      const error = new CommandError('Test error', 'cmd', 'sub', ['Hint']);
      const json = error.toJSON();
      expect(json.command).toBe('cmd');
      expect(json.subcommand).toBe('sub');
      expect(json.hints).toEqual(['Hint']);
    });

    it('should create unknown command error with hints', () => {
      const error = CommandError.unknownCommand('foo');
      expect(error.message).toContain('Unknown command');
      expect(error.command).toBe('foo');
      expect(error.hints).toContain('Run: productive --help to see available commands');
    });

    it('should create unknown subcommand error with hints', () => {
      const error = CommandError.unknownSubcommand('time', 'foo');
      expect(error.message).toContain('Unknown subcommand');
      expect(error.command).toBe('time');
      expect(error.subcommand).toBe('foo');
      expect(error.hints).toContain('Run: productive time --help to see available subcommands');
    });

    it('should create missing argument error', () => {
      const error = CommandError.missingArgument('time get', 'id', 'productive time get <id>');
      expect(error.message).toContain('Missing required argument');
      expect(error.hints).toContain('Usage: productive time get <id>');
    });
  });

  describe('Type guards', () => {
    it('isCliError should identify CliError instances', () => {
      expect(isCliError(new ConfigError('test'))).toBe(true);
      expect(isCliError(new ValidationError('test'))).toBe(true);
      expect(isCliError(new ApiError('test', 500))).toBe(true);
      expect(isCliError(new Error('test'))).toBe(false);
      expect(isCliError('string')).toBe(false);
      expect(isCliError(null)).toBe(false);
    });

    it('isApiError should identify ApiError instances', () => {
      expect(isApiError(new ApiError('test', 500))).toBe(true);
      expect(isApiError(new AuthenticationError('test'))).toBe(true);
      expect(isApiError(new ServerError('test', 500))).toBe(true);
      expect(isApiError(new ConfigError('test'))).toBe(false);
      expect(isApiError(new Error('test'))).toBe(false);
    });

    it('isRecoverable should check error recoverability', () => {
      expect(isRecoverable(new ServerError('test', 500))).toBe(true);
      expect(isRecoverable(new RateLimitError('test'))).toBe(true);
      expect(isRecoverable(new ConfigError('test'))).toBe(true);
      expect(isRecoverable(new AuthenticationError('test'))).toBe(false);
      expect(isRecoverable(new NotFoundError('test'))).toBe(false);
      expect(isRecoverable(new Error('test'))).toBe(false);
    });
  });

  describe('fromLegacyError', () => {
    it('should pass through CliError instances', () => {
      const original = new ConfigError('test');
      const converted = fromLegacyError(original);
      expect(converted).toBe(original);
    });

    it('should convert legacy ProductiveApiError', () => {
      const legacy = Object.assign(new Error('API failed'), {
        name: 'ProductiveApiError',
        statusCode: 401,
        response: { errors: [] },
      });
      const converted = fromLegacyError(legacy);
      expect(converted).toBeInstanceOf(AuthenticationError);
      expect(converted.message).toBe('API failed');
    });

    it('should wrap unknown Error instances', () => {
      const error = new Error('unknown error');
      const converted = fromLegacyError(error);
      expect(converted).toBeInstanceOf(ApiError);
      expect(converted.message).toBe('unknown error');
      expect(converted.cause).toBe(error);
    });

    it('should handle non-Error values', () => {
      const converted = fromLegacyError('string error');
      expect(converted).toBeInstanceOf(ApiError);
      expect(converted.message).toBe('string error');
    });
  });

  describe('JSON serialization', () => {
    it('should serialize base error properties', () => {
      const error = new ApiError('Test error', 500, '/projects');
      const json = error.toJSON();
      expect(json.error).toBe('API_ERROR');
      expect(json.name).toBe('ApiError');
      expect(json.message).toBe('Test error');
      expect(json.isRecoverable).toBe(true);
      expect(json.statusCode).toBe(500);
      expect(json.endpoint).toBe('/projects');
    });

    it('should include cause message if cause is Error', () => {
      const cause = new Error('original error');
      const error = new CacheError('Cache failed', 'read', undefined, cause);
      const json = error.toJSON();
      expect(json.cause).toEqual({ message: 'original error' });
    });

    it('should not include cause if not Error', () => {
      const error = new ConfigError('Config error');
      const json = error.toJSON();
      expect(json.cause).toBeUndefined();
    });
  });
});
