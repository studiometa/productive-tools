import { describe, it, expect, vi, afterEach } from 'vitest';

import { showProjectsHelp } from '../help.js';

describe('showProjectsHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help', () => {
    showProjectsHelp();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('productive projects');
  });

  it('shows get subcommand help', () => {
    showProjectsHelp('get');
    expect(spy).toHaveBeenCalled();
  });

  it('shows ls subcommand help', () => {
    showProjectsHelp('ls');
    expect(spy).toHaveBeenCalled();
  });
});
