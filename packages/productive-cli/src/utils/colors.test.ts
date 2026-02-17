import { describe, it, expect, beforeEach, vi } from 'vitest';

import { colors, setColorEnabled, isColorEnabled, log } from './colors.js';

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

  it('should apply yellow color', () => {
    const result = colors.yellow('warning');
    expect(result).toContain('\x1b[33m');
    expect(result).toContain('warning');
    expect(result).toContain('\x1b[0m');
  });

  it('should apply magenta color', () => {
    const result = colors.magenta('highlight');
    expect(result).toContain('\x1b[35m');
    expect(result).toContain('highlight');
    expect(result).toContain('\x1b[0m');
  });

  it('should apply blue color', () => {
    const result = colors.blue('info');
    expect(result).toContain('\x1b[34m');
    expect(result).toContain('info');
  });

  it('should apply black color', () => {
    const result = colors.black('text');
    expect(result).toContain('\x1b[30m');
    expect(result).toContain('text');
  });

  it('should apply white color', () => {
    const result = colors.white('text');
    expect(result).toContain('\x1b[37m');
    expect(result).toContain('text');
  });

  it('should apply underline styling', () => {
    const result = colors.underline('link');
    expect(result).toContain('\x1b[4m');
    expect(result).toContain('link');
    expect(result).toContain('\x1b[0m');
  });

  it('should apply reset', () => {
    const result = colors.reset('text');
    expect(result).toContain('\x1b[0m');
    expect(result).toContain('text');
  });

  it('should apply bgRed', () => {
    const result = colors.bgRed('alert');
    expect(result).toContain('\x1b[41m');
    expect(result).toContain('alert');
  });

  it('should apply bgGreen', () => {
    const result = colors.bgGreen('ok');
    expect(result).toContain('\x1b[42m');
    expect(result).toContain('ok');
  });

  it('should apply bgYellow', () => {
    const result = colors.bgYellow('warn');
    expect(result).toContain('\x1b[43m');
    expect(result).toContain('warn');
  });

  it('should not apply colors when disabled', () => {
    setColorEnabled(false);
    const result = colors.red('error');
    expect(result).toBe('error');
    expect(result).not.toContain('\x1b[');
  });

  it('should not apply any formatting when disabled', () => {
    setColorEnabled(false);

    expect(colors.bold('text')).toBe('text');
    expect(colors.dim('text')).toBe('text');
    expect(colors.underline('text')).toBe('text');
    expect(colors.yellow('text')).toBe('text');
    expect(colors.magenta('text')).toBe('text');
    expect(colors.blue('text')).toBe('text');
    expect(colors.black('text')).toBe('text');
    expect(colors.white('text')).toBe('text');
    expect(colors.gray('text')).toBe('text');
    expect(colors.cyan('text')).toBe('text');
    expect(colors.green('text')).toBe('text');
    expect(colors.bgRed('text')).toBe('text');
    expect(colors.bgGreen('text')).toBe('text');
    expect(colors.bgYellow('text')).toBe('text');
    expect(colors.reset('text')).toBe('text');
  });

  it('should track color enabled state', () => {
    setColorEnabled(true);
    expect(isColorEnabled()).toBe(true);

    setColorEnabled(false);
    expect(isColorEnabled()).toBe(false);
  });

  it('should toggle colors on and off', () => {
    setColorEnabled(true);
    expect(colors.red('x')).toContain('\x1b[31m');

    setColorEnabled(false);
    expect(colors.red('x')).toBe('x');

    setColorEnabled(true);
    expect(colors.red('x')).toContain('\x1b[31m');
  });
});

describe('log', () => {
  beforeEach(() => {
    setColorEnabled(true);
  });

  it('should log info messages with blue color', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.info('test info');
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[34m');
    expect(output).toContain('test info');
    spy.mockRestore();
  });

  it('should log success messages with green color and checkmark', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.success('done');
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[32m');
    expect(output).toContain('✓');
    expect(output).toContain('done');
    spy.mockRestore();
  });

  it('should log warning messages with yellow color and warning symbol', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.warning('careful');
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[33m');
    expect(output).toContain('⚠');
    expect(output).toContain('careful');
    spy.mockRestore();
  });

  it('should log error messages with red color and cross to stderr', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    log.error('failure');
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[31m');
    expect(output).toContain('✗');
    expect(output).toContain('failure');
    spy.mockRestore();
  });

  it('should log dim messages', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log.dim('subtle');
    expect(spy).toHaveBeenCalledTimes(1);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('\x1b[2m');
    expect(output).toContain('subtle');
    spy.mockRestore();
  });

  it('should output plain text when colors disabled', () => {
    setColorEnabled(false);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    log.info('info');
    expect(logSpy.mock.calls[0][0]).toBe('info');

    log.success('ok');
    expect(logSpy.mock.calls[1][0]).toBe('✓ ok');

    log.warning('warn');
    expect(logSpy.mock.calls[2][0]).toBe('⚠ warn');

    log.error('err');
    expect(errorSpy.mock.calls[0][0]).toBe('✗ err');

    log.dim('dim');
    expect(logSpy.mock.calls[3][0]).toBe('dim');

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
