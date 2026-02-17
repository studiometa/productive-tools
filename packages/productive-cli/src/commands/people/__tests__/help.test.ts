import { describe, it, expect, vi, afterEach } from 'vitest';

import { showPeopleHelp } from '../help.js';

describe('showPeopleHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help with no argument', () => {
    showPeopleHelp();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive people');
    expect(output).toContain('list, ls');
    expect(output).toContain('get');
  });

  it('shows list help for "list"', () => {
    showPeopleHelp('list');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive people list');
    expect(output).toContain('--company');
    expect(output).toContain('--project');
    expect(output).toContain('--type');
    expect(output).toContain('--status');
  });

  it('shows list help for "ls" alias', () => {
    showPeopleHelp('ls');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive people list');
  });

  it('shows get help', () => {
    showPeopleHelp('get');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive people get');
    expect(output).toContain('<id>');
  });
});
