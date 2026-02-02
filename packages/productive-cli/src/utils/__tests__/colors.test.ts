import { describe, it, expect, beforeEach } from 'vitest';

import { colors, setColorEnabled, isColorEnabled } from '../colors.js';

describe('colors', () => {
  beforeEach(() => {
    setColorEnabled(true);
  });

  it('should apply bold formatting', () => {
    const result = colors.bold('test');
    expect(result).toContain('\x1b[1m');
    expect(result).toContain('test');
    expect(result).toContain('\x1b[0m');
  });

  it('should apply red color', () => {
    const result = colors.red('error');
    expect(result).toContain('\x1b[31m');
    expect(result).toContain('error');
    expect(result).toContain('\x1b[0m');
  });

  it('should apply green color', () => {
    const result = colors.green('success');
    expect(result).toContain('\x1b[32m');
    expect(result).toContain('success');
  });

  it('should apply cyan color', () => {
    const result = colors.cyan('info');
    expect(result).toContain('\x1b[36m');
    expect(result).toContain('info');
  });

  it('should apply dim styling', () => {
    const result = colors.dim('subtle');
    expect(result).toContain('\x1b[2m');
    expect(result).toContain('subtle');
  });

  it('should apply gray color', () => {
    const result = colors.gray('muted');
    expect(result).toContain('\x1b[90m');
    expect(result).toContain('muted');
  });

  it('should not apply colors when disabled', () => {
    setColorEnabled(false);
    const result = colors.red('error');
    expect(result).toBe('error');
    expect(result).not.toContain('\x1b[');
  });

  it('should track color enabled state', () => {
    setColorEnabled(true);
    expect(isColorEnabled()).toBe(true);

    setColorEnabled(false);
    expect(isColorEnabled()).toBe(false);
  });
});
