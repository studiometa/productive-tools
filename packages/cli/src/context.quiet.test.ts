import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTestContext } from './context.js';

// Mock console methods for testing
const consoleMocks = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('CommandContext with --quiet flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTestContext', () => {
    it('should create context with quiet=true when --quiet flag is provided', () => {
      const ctx = createTestContext({
        options: { quiet: true, format: 'human' },
      });

      // Test that formatter suppresses messages in quiet mode
      ctx.formatter.success('Test message');
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should create context with quiet=true when -q flag is provided', () => {
      const ctx = createTestContext({
        options: { q: true, format: 'human' },
      });

      // Test that formatter suppresses messages in quiet mode
      ctx.formatter.success('Test message');
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should create context with quiet=false when no quiet flags are provided', () => {
      const ctx = createTestContext({
        options: { format: 'human' },
      });

      // Test that formatter shows messages in normal mode
      ctx.formatter.success('Test message');
      expect(consoleMocks.log).toHaveBeenCalledWith(expect.stringContaining('Test message'));
    });

    it('should prefer --quiet over -q when both are provided', () => {
      const ctx = createTestContext({
        options: { quiet: true, q: false, format: 'human' },
      });

      // Should still be quiet since quiet=true takes precedence
      ctx.formatter.success('Test message');
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should create no-op spinner in quiet mode', () => {
      const ctx = createTestContext({
        options: { quiet: true, format: 'human' },
      });
      const spinner = ctx.createSpinner('Loading...');

      // Should return a no-op spinner
      expect(spinner.start()).toBe(spinner);
      expect(spinner.succeed()).toBe(spinner);
    });

    it('should create regular spinner in normal mode', () => {
      const ctx = createTestContext({
        options: { quiet: false, format: 'human' },
      });
      const spinner = ctx.createSpinner('Loading...');

      // Should return a real spinner (check it has expected methods)
      expect(spinner).toHaveProperty('start');
      expect(spinner).toHaveProperty('succeed');
      expect(spinner).toHaveProperty('fail');
      expect(spinner).toHaveProperty('stop');
      expect(spinner).toHaveProperty('setText');
    });
  });

  describe('formatter with explicit options', () => {
    it('should create formatter with quiet=true when quiet option is provided', () => {
      const ctx = createTestContext({
        options: { quiet: true, format: 'json' },
      });

      // Test that formatter suppresses messages in quiet mode
      ctx.formatter.success('Test message');
      expect(consoleMocks.log).not.toHaveBeenCalled();
    });

    it('should create formatter with quiet=false when no quiet option is provided', () => {
      const ctx = createTestContext({
        options: { format: 'json' },
      });

      // Test that formatter shows messages in normal mode
      ctx.formatter.success('Test message');
      expect(consoleMocks.log).toHaveBeenCalledWith(
        JSON.stringify({ status: 'success', message: 'Test message' }),
      );
    });
  });

  describe('options parsing', () => {
    it('should handle quiet option correctly in option parsing', () => {
      const ctx = createTestContext({
        options: { quiet: true, format: 'json' },
      });

      expect(ctx.options.quiet).toBe(true);
    });

    it('should handle -q short flag correctly', () => {
      const ctx = createTestContext({
        options: { q: true, format: 'json' },
      });

      expect(ctx.options.q).toBe(true);
    });

    it('should handle boolean false values correctly', () => {
      const ctx = createTestContext({
        options: { quiet: false, format: 'json' },
      });

      expect(ctx.options.quiet).toBe(false);
    });
  });
});
