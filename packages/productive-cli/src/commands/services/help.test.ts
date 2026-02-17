import { describe, it, expect, vi, afterEach } from 'vitest';

import { showServicesHelp } from './help.js';

describe('showServicesHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help', () => {
    showServicesHelp();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('productive services');
  });

  it('shows ls subcommand help', () => {
    showServicesHelp('ls');
    expect(spy).toHaveBeenCalled();
  });
});
