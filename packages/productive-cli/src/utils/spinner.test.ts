import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Spinner, spinner } from './spinner.js';

describe('Spinner', () => {
  let originalIsTTY: boolean;
  let originalCI: string | undefined;
  let writeSpy: any;
  let clearLineSpy: any;
  let cursorToSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();
    originalIsTTY = (process.stderr as any).isTTY;
    originalCI = process.env.CI;
    (process.stderr as any).isTTY = true;
    delete process.env.CI;

    // Mock TTY methods
    writeSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    clearLineSpy = vi.fn(() => true);
    cursorToSpy = vi.fn(() => true);
    (process.stderr as any).clearLine = clearLineSpy;
    (process.stderr as any).cursorTo = cursorToSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    (process.stderr as any).isTTY = originalIsTTY;
    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    }
  });

  it('should create spinner with text', () => {
    const s = new Spinner('Loading...');
    expect(s).toBeDefined();
  });

  it('should create spinner with default text', () => {
    const s = new Spinner();
    expect(s).toBeDefined();
  });

  it('should start and stop', () => {
    const s = new Spinner('Loading...');

    s.start();
    expect(writeSpy).toHaveBeenCalled();

    vi.advanceTimersByTime(160); // 80ms per frame, so 2 frames
    expect(writeSpy).toHaveBeenCalledTimes(3); // Initial render + 2 interval ticks

    s.stop();
    expect(clearLineSpy).toHaveBeenCalled();
    expect(cursorToSpy).toHaveBeenCalled();
  });

  it('should succeed with custom text', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const s = new Spinner('Loading...');
    s.start();
    s.succeed('Done!');

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Done!'));
    consoleLogSpy.mockRestore();
  });

  it('should succeed with default text', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const s = new Spinner('Loading...');
    s.start();
    s.succeed();

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Loading...'));
    consoleLogSpy.mockRestore();
  });

  it('should fail with custom text', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const s = new Spinner('Loading...');
    s.start();
    s.fail('Error!');

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error!'));
    consoleErrorSpy.mockRestore();
  });

  it('should fail with default text', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const s = new Spinner('Loading...');
    s.start();
    s.fail();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Loading...'));
    consoleErrorSpy.mockRestore();
  });

  it('should set text', () => {
    const s = new Spinner('Loading...');
    s.setText('New text');
    expect(s).toBeDefined();
  });

  it('should set text and re-render when running', () => {
    const s = new Spinner('Loading...');
    s.start();
    writeSpy.mockClear();

    s.setText('Updated text');
    expect(writeSpy).toHaveBeenCalled();

    s.stop();
  });

  it('should handle chaining', () => {
    const s = new Spinner('Loading...');
    const result = s.start().setText('Updated').stop();
    expect(result).toBe(s);
  });

  it('should not render when not in TTY', () => {
    (process.stderr as any).isTTY = false;
    writeSpy.mockClear();
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const s = new Spinner('Loading...');
    s.start();
    expect(writeSpy).not.toHaveBeenCalled();

    s.succeed('Done!');
    expect(consoleLogSpy).not.toHaveBeenCalled();

    const s2 = new Spinner('Loading...');
    s2.start();
    s2.fail('Error!');
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should not render when in CI', () => {
    process.env.CI = 'true';
    writeSpy.mockClear();

    const s = new Spinner('Loading...');
    s.start();
    expect(writeSpy).not.toHaveBeenCalled();

    s.stop();
  });

  it('should stop without starting', () => {
    const callsBeforeStop = clearLineSpy.mock.calls.length;
    const s = new Spinner('Loading...');
    s.stop();
    // Should call clearLine once even without starting (to clean up any previous state)
    expect(clearLineSpy.mock.calls.length).toBe(callsBeforeStop + 1);
  });

  it('should handle multiple starts', () => {
    const s = new Spinner('Loading...');

    s.start();
    const firstCallCount = writeSpy.mock.calls.length;

    s.start();
    const secondCallCount = writeSpy.mock.calls.length;

    expect(secondCallCount).toBeGreaterThan(firstCallCount);

    s.stop();
  });

  describe('spinner factory function', () => {
    it('should create spinner with factory function', () => {
      const s = spinner('Loading...');
      expect(s).toBeInstanceOf(Spinner);
    });

    it('should create spinner without text', () => {
      const s = spinner();
      expect(s).toBeInstanceOf(Spinner);
    });
  });
});
