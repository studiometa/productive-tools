import { describe, it, expect, vi, afterEach } from 'vitest';

import { showResolveHelp } from './help.js';

describe('showResolveHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help', () => {
    showResolveHelp();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toContain('productive resolve');
  });

  it('shows detect subcommand help', () => {
    showResolveHelp('detect');
    expect(spy).toHaveBeenCalled();
  });
});
