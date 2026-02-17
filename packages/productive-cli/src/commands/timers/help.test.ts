import { describe, it, expect, vi, afterEach } from 'vitest';

import { showTimersHelp } from './help.js';

describe('showTimersHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help', () => {
    showTimersHelp();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('productive timers');
  });

  it('shows get subcommand help', () => {
    showTimersHelp('get');
    expect(spy).toHaveBeenCalled();
  });

  it('shows ls subcommand help', () => {
    showTimersHelp('ls');
    expect(spy).toHaveBeenCalled();
  });

  it('shows start subcommand help', () => {
    showTimersHelp('start');
    expect(spy).toHaveBeenCalled();
  });

  it('shows stop subcommand help', () => {
    showTimersHelp('stop');
    expect(spy).toHaveBeenCalled();
  });
});
