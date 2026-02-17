import { describe, it, expect, vi, afterEach } from 'vitest';

import { showTimeHelp } from './help.js';

describe('showTimeHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help', () => {
    showTimeHelp();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('productive time');
  });

  it('shows add subcommand help', () => {
    showTimeHelp('add');
    expect(spy).toHaveBeenCalled();
  });

  it('shows get subcommand help', () => {
    showTimeHelp('get');
    expect(spy).toHaveBeenCalled();
  });

  it('shows ls subcommand help', () => {
    showTimeHelp('ls');
    expect(spy).toHaveBeenCalled();
  });

  it('shows rm subcommand help', () => {
    showTimeHelp('rm');
    expect(spy).toHaveBeenCalled();
  });

  it('shows update subcommand help', () => {
    showTimeHelp('update');
    expect(spy).toHaveBeenCalled();
  });
});
