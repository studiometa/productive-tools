import { describe, it, expect, vi, afterEach } from 'vitest';

import { showTasksHelp } from '../help.js';

describe('showTasksHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help', () => {
    showTasksHelp();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('productive tasks');
  });

  it('shows create subcommand help', () => {
    showTasksHelp('create');
    expect(spy).toHaveBeenCalled();
  });

  it('shows get subcommand help', () => {
    showTasksHelp('get');
    expect(spy).toHaveBeenCalled();
  });

  it('shows ls subcommand help', () => {
    showTasksHelp('ls');
    expect(spy).toHaveBeenCalled();
  });

  it('shows update subcommand help', () => {
    showTasksHelp('update');
    expect(spy).toHaveBeenCalled();
  });
});
