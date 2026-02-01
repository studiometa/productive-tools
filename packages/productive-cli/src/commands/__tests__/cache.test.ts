import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatBytes, formatDuration, showCacheHelp } from '../cache.js';

describe('cache command', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 5.5)).toBe('5.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes', () => {
      expect(formatDuration(60)).toBe('1m');
      expect(formatDuration(120)).toBe('2m');
      expect(formatDuration(3599)).toBe('59m');
    });

    it('should format hours', () => {
      expect(formatDuration(3600)).toBe('1h');
      expect(formatDuration(7200)).toBe('2h');
      expect(formatDuration(86399)).toBe('23h');
    });

    it('should format days', () => {
      expect(formatDuration(86400)).toBe('1d');
      expect(formatDuration(172800)).toBe('2d');
      expect(formatDuration(604800)).toBe('7d');
    });
  });

  describe('showCacheHelp', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should show general help without subcommand', () => {
      showCacheHelp();
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('productive cache');
      expect(output).toContain('status');
      expect(output).toContain('clear');
      expect(output).toContain('sync');
      expect(output).toContain('queue');
    });

    it('should show status subcommand help', () => {
      showCacheHelp('status');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('cache status');
      expect(output).toContain('Show cache statistics');
    });

    it('should show clear subcommand help', () => {
      showCacheHelp('clear');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('cache clear');
      expect(output).toContain('Clear cached data');
    });

    it('should show sync subcommand help', () => {
      showCacheHelp('sync');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('cache sync');
      expect(output).toContain('Sync reference data');
    });

    it('should show queue subcommand help', () => {
      showCacheHelp('queue');
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.flat().join('');
      expect(output).toContain('cache queue');
      expect(output).toContain('background refresh queue');
    });
  });
});
