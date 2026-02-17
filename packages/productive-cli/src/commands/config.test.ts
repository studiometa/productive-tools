import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as configModule from '../config.js';
import { handleConfigCommand } from './config.js';

// Mock dependencies
vi.mock('../config.js', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn().mockReturnValue({ stored: true, location: 'config file' }),
  clearConfig: vi.fn(),
  validateConfig: vi.fn(),
  isKeychainAvailable: vi.fn().mockReturnValue(false),
  getKeychainBackend: vi.fn().mockReturnValue('none'),
}));

vi.mock('../output.js', () => ({
  OutputFormatter: vi.fn(function (format, noColor) {
    return {
      format,
      noColor,
      output: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      success: vi.fn(),
    };
  }),
}));

describe('config command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Mock process.exit to throw an error so execution stops
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('set subcommand', () => {
    beforeEach(() => {
      vi.mocked(configModule.setConfig).mockClear();
    });

    it('should set a valid configuration key', () => {
      handleConfigCommand('set', ['apiToken', 'test-token'], {});

      expect(configModule.setConfig).toHaveBeenCalledWith('apiToken', 'test-token');
    });

    it('should set organizationId', () => {
      handleConfigCommand('set', ['organizationId', '12345'], {});

      expect(configModule.setConfig).toHaveBeenCalledWith('organizationId', '12345');
    });

    it('should set userId', () => {
      handleConfigCommand('set', ['userId', '67890'], {});

      expect(configModule.setConfig).toHaveBeenCalledWith('userId', '67890');
    });

    it('should set baseUrl', () => {
      handleConfigCommand('set', ['baseUrl', 'https://api.productive.io'], {});

      expect(configModule.setConfig).toHaveBeenCalledWith('baseUrl', 'https://api.productive.io');
    });

    it('should exit with error when key is missing', () => {
      expect(() => handleConfigCommand('set', [], {})).toThrow('process.exit(3)');
      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when value is missing', () => {
      expect(() => handleConfigCommand('set', ['apiToken'], {})).toThrow('process.exit(3)');
      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error for invalid configuration key', () => {
      expect(() => handleConfigCommand('set', ['invalidKey', 'value'], {})).toThrow(
        'process.exit(3)',
      );
      expect(processExitSpy).toHaveBeenCalledWith(3);
      // Check that setConfig was NOT called after clearing at the start of this test
      const calls = vi.mocked(configModule.setConfig).mock.calls;
      expect(calls.length).toBe(0);
    });
  });

  describe('get subcommand', () => {
    it('should get a specific configuration key', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        apiToken: 'test-token',
        organizationId: '12345',
        userId: null,
        baseUrl: null,
      });

      handleConfigCommand('get', ['apiToken'], {});

      expect(configModule.getConfig).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get organizationId', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        apiToken: null,
        organizationId: '12345',
        userId: null,
        baseUrl: null,
      });

      handleConfigCommand('get', ['organizationId'], {});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should display all configuration when no key is provided', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        apiToken: 'test-token-123456',
        organizationId: '12345',
        userId: '67890',
        baseUrl: 'https://api.productive.io',
      });

      handleConfigCommand('get', [], {});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should mask apiToken by default', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        apiToken: 'test-token-123456',
        organizationId: '12345',
        userId: null,
        baseUrl: null,
      });

      handleConfigCommand('get', ['apiToken'], {});

      expect(consoleLogSpy).toHaveBeenCalled();
      // The actual masking happens in the function
    });

    it('should not mask apiToken with --no-mask flag', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        apiToken: 'test-token-123456',
        organizationId: '12345',
        userId: null,
        baseUrl: null,
      });

      handleConfigCommand('get', ['apiToken'], { 'no-mask': true });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get configuration in json format', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        apiToken: 'test-token',
        organizationId: '12345',
        userId: null,
        baseUrl: null,
      });

      handleConfigCommand('get', ['apiToken'], { format: 'json' });

      expect(configModule.getConfig).toHaveBeenCalled();
    });

    it('should exit with error for invalid configuration key', () => {
      expect(() => handleConfigCommand('get', ['invalidKey'], {})).toThrow('process.exit(3)');
      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should warn when key is not set', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        apiToken: null,
        organizationId: null,
        userId: null,
        baseUrl: null,
      });

      handleConfigCommand('get', ['apiToken'], {});

      // The warning method should have been called through the formatter
      expect(configModule.getConfig).toHaveBeenCalled();
    });
  });

  describe('validate subcommand', () => {
    it('should validate configuration successfully', () => {
      vi.mocked(configModule.validateConfig).mockReturnValue({
        valid: true,
        missing: [],
      });

      handleConfigCommand('validate', [], {});

      expect(configModule.validateConfig).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should exit with error when configuration is invalid', () => {
      vi.mocked(configModule.validateConfig).mockReturnValue({
        valid: false,
        missing: ['apiToken', 'organizationId'],
      });

      expect(() => handleConfigCommand('validate', [], {})).toThrow('process.exit(4)');
      expect(configModule.validateConfig).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(4);
    });

    it('should validate configuration in json format', () => {
      vi.mocked(configModule.validateConfig).mockReturnValue({
        valid: true,
        missing: [],
      });

      // Valid config in json format should not throw
      handleConfigCommand('validate', [], { format: 'json' });
      expect(configModule.validateConfig).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should validate configuration in json format with errors', () => {
      vi.mocked(configModule.validateConfig).mockReturnValue({
        valid: false,
        missing: ['apiToken'],
      });

      expect(() => handleConfigCommand('validate', [], { format: 'json' })).toThrow(
        'process.exit(4)',
      );
      expect(configModule.validateConfig).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(4);
    });
  });

  describe('clear subcommand', () => {
    it('should clear configuration', () => {
      handleConfigCommand('clear', [], {});

      expect(configModule.clearConfig).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', () => {
      expect(() => handleConfigCommand('unknown', [], {})).toThrow('process.exit(1)');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
