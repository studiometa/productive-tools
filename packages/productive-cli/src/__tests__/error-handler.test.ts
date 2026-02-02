import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApiError } from '../api.js';
import {
  ExitCode,
  getExitCode,
  handleError,
  handleResult,
  runCommand,
  runCommandSync,
  exitWithValidationError,
  exitWithConfigError,
} from '../error-handler.js';
import {
  AuthenticationError,
  ValidationError,
  ConfigError,
  ApiError,
  CliError,
} from '../errors.js';
import { ok, err } from '../utils/result.js';

describe('error-handler', () => {
  let mockFormatter: {
    output: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    format: string;
  };
  let mockExit: ReturnType<typeof vi.fn>;
  let originalExit: typeof process.exit;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFormatter = {
      output: vi.fn(),
      error: vi.fn(),
      format: 'human',
    };

    // Mock process.exit
    originalExit = process.exit;
    mockExit = vi.fn() as unknown as ReturnType<typeof vi.fn>;
    process.exit = mockExit as unknown as typeof process.exit;

    // Mock console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  describe('ExitCode', () => {
    it('should have correct exit code values', () => {
      expect(ExitCode.SUCCESS).toBe(0);
      expect(ExitCode.GENERAL_ERROR).toBe(1);
      expect(ExitCode.AUTHENTICATION_ERROR).toBe(2);
      expect(ExitCode.VALIDATION_ERROR).toBe(3);
      expect(ExitCode.CONFIG_ERROR).toBe(4);
      expect(ExitCode.NOT_FOUND_ERROR).toBe(5);
    });
  });

  describe('getExitCode', () => {
    it('should return AUTHENTICATION_ERROR for AuthenticationError', () => {
      const error = new AuthenticationError('Unauthorized');
      expect(getExitCode(error)).toBe(ExitCode.AUTHENTICATION_ERROR);
    });

    it('should return VALIDATION_ERROR for ValidationError', () => {
      const error = ValidationError.required('field');
      expect(getExitCode(error)).toBe(ExitCode.VALIDATION_ERROR);
    });

    it('should return CONFIG_ERROR for ConfigError', () => {
      const error = ConfigError.missingToken();
      expect(getExitCode(error)).toBe(ExitCode.CONFIG_ERROR);
    });

    it('should return NOT_FOUND_ERROR for ApiError with 404', () => {
      const error = new ApiError('Not found', 404, '/projects/999');
      expect(getExitCode(error)).toBe(ExitCode.NOT_FOUND_ERROR);
    });

    it('should return GENERAL_ERROR for ApiError with other status', () => {
      const error = new ApiError('Server error', 500, '/projects');
      expect(getExitCode(error)).toBe(ExitCode.GENERAL_ERROR);
    });

    it('should return GENERAL_ERROR for unknown errors', () => {
      const error = new Error('Unknown error');
      expect(getExitCode(error)).toBe(ExitCode.GENERAL_ERROR);
    });
  });

  describe('handleError', () => {
    it('should output error in human format', () => {
      const error = new ValidationError('Invalid input', 'field');

      handleError(error, mockFormatter, { exit: false });

      expect(mockFormatter.error).toHaveBeenCalledWith('Invalid input');
    });

    it('should output error in JSON format', () => {
      mockFormatter.format = 'json';
      const error = new ValidationError('Invalid input', 'field');

      handleError(error, mockFormatter, { exit: false });

      expect(mockFormatter.output).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
        }),
      );
    });

    it('should call process.exit by default', () => {
      const error = new CliError('Error');

      handleError(error, mockFormatter);

      expect(mockExit).toHaveBeenCalledWith(ExitCode.GENERAL_ERROR);
    });

    it('should not call process.exit when exit: false', () => {
      const error = new CliError('Error');

      const exitCode = handleError(error, mockFormatter, { exit: false });

      expect(mockExit).not.toHaveBeenCalled();
      expect(exitCode).toBe(ExitCode.GENERAL_ERROR);
    });

    it('should convert ProductiveApiError to ApiError', () => {
      const error = new ProductiveApiError('API failed', 401, '{"error":"unauthorized"}');

      handleError(error, mockFormatter, { exit: false });

      expect(mockFormatter.error).toHaveBeenCalledWith('API failed');
    });

    it('should convert plain Error to CliError', () => {
      const error = new Error('Plain error');

      handleError(error, mockFormatter, { exit: false });

      expect(mockFormatter.error).toHaveBeenCalledWith('Plain error');
    });

    it('should show missing keys for ConfigError', () => {
      const error = new ConfigError('Missing config', ['apiToken', 'orgId']);

      handleError(error, mockFormatter, { exit: false });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Missing: apiToken, orgId');
    });
  });

  describe('handleResult', () => {
    it('should output value on success', () => {
      const result = ok({ data: 'test' });

      const success = handleResult(result, mockFormatter);

      expect(success).toBe(true);
      expect(mockFormatter.output).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should call onSuccess callback on success', () => {
      const result = ok({ data: 'test' });
      const onSuccess = vi.fn();

      handleResult(result, mockFormatter, onSuccess);

      expect(onSuccess).toHaveBeenCalledWith({ data: 'test' });
      expect(mockFormatter.output).not.toHaveBeenCalled();
    });

    it('should handle error on failure', () => {
      const error = ValidationError.required('field');
      const result = err(error);

      const success = handleResult(result, mockFormatter);

      expect(success).toBe(false);
      expect(mockExit).toHaveBeenCalled();
    });
  });

  describe('runCommand', () => {
    it('should return result on success', async () => {
      const result = await runCommand(async () => {
        return { data: 'test' };
      }, mockFormatter);

      expect(result).toEqual({ data: 'test' });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should handle errors and exit', async () => {
      await runCommand(async () => {
        throw new ValidationError('Invalid');
      }, mockFormatter);

      expect(mockFormatter.error).toHaveBeenCalledWith('Invalid');
      expect(mockExit).toHaveBeenCalledWith(ExitCode.VALIDATION_ERROR);
    });
  });

  describe('runCommandSync', () => {
    it('should return result on success', () => {
      const result = runCommandSync(() => {
        return { data: 'test' };
      }, mockFormatter);

      expect(result).toEqual({ data: 'test' });
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should handle errors and exit', () => {
      runCommandSync(() => {
        throw new ConfigError('Missing config');
      }, mockFormatter);

      expect(mockFormatter.error).toHaveBeenCalledWith('Missing config');
      expect(mockExit).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);
    });
  });

  describe('exitWithValidationError', () => {
    it('should output error in human format with usage', () => {
      try {
        exitWithValidationError('id', 'productive get <id>', mockFormatter);
      } catch {
        // process.exit is mocked, so it won't actually exit
      }

      expect(mockFormatter.error).toHaveBeenCalledWith(expect.stringContaining('id is required'));
      expect(mockFormatter.error).toHaveBeenCalledWith(
        expect.stringContaining('Usage: productive get <id>'),
      );
      expect(mockExit).toHaveBeenCalledWith(ExitCode.VALIDATION_ERROR);
    });

    it('should output error in JSON format with usage', () => {
      mockFormatter.format = 'json';

      try {
        exitWithValidationError('id', 'productive get <id>', mockFormatter);
      } catch {
        // process.exit is mocked
      }

      expect(mockFormatter.output).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          usage: 'productive get <id>',
        }),
      );
    });
  });

  describe('exitWithConfigError', () => {
    it('should handle missing apiToken', () => {
      try {
        exitWithConfigError('apiToken', mockFormatter);
      } catch {
        // process.exit is mocked
      }

      expect(mockFormatter.error).toHaveBeenCalledWith(
        expect.stringContaining('API token not configured'),
      );
      expect(mockExit).toHaveBeenCalledWith(ExitCode.CONFIG_ERROR);
    });

    it('should handle missing organizationId', () => {
      try {
        exitWithConfigError('organizationId', mockFormatter);
      } catch {
        // process.exit is mocked
      }

      expect(mockFormatter.error).toHaveBeenCalledWith(
        expect.stringContaining('Organization ID not configured'),
      );
    });

    it('should handle missing userId', () => {
      try {
        exitWithConfigError('userId', mockFormatter);
      } catch {
        // process.exit is mocked
      }

      expect(mockFormatter.error).toHaveBeenCalledWith(
        expect.stringContaining('User ID not configured'),
      );
    });
  });
});
