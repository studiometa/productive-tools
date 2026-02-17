import { describe, it, expect, vi, afterEach } from 'vitest';

import { showDealsHelp } from '../help.js';

describe('showDealsHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help with no argument', () => {
    showDealsHelp();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive deals');
    expect(output).toContain('list, ls');
    expect(output).toContain('get');
    expect(output).toContain('add, create');
    expect(output).toContain('update');
  });

  it('shows list help for "list"', () => {
    showDealsHelp('list');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive deals list');
    expect(output).toContain('--company');
    expect(output).toContain('--status');
    expect(output).toContain('--type');
  });

  it('shows list help for "ls" alias', () => {
    showDealsHelp('ls');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive deals list');
  });

  it('shows get help', () => {
    showDealsHelp('get');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive deals get');
    expect(output).toContain('<id>');
  });

  it('shows add help for "add"', () => {
    showDealsHelp('add');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive deals add');
    expect(output).toContain('--name');
    expect(output).toContain('--company');
    expect(output).toContain('--budget');
  });

  it('shows add help for "create" alias', () => {
    showDealsHelp('create');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive deals add');
  });

  it('shows update help', () => {
    showDealsHelp('update');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive deals update');
    expect(output).toContain('--name');
    expect(output).toContain('--end-date');
  });
});
