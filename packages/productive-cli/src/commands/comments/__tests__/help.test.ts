import { describe, it, expect, vi, afterEach } from 'vitest';

import { showCommentsHelp } from '../help.js';

describe('showCommentsHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help with no argument', () => {
    showCommentsHelp();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive comments');
    expect(output).toContain('list, ls');
    expect(output).toContain('get');
    expect(output).toContain('add, create');
    expect(output).toContain('update');
  });

  it('shows list help for "list"', () => {
    showCommentsHelp('list');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive comments list');
    expect(output).toContain('--task');
    expect(output).toContain('--deal');
  });

  it('shows list help for "ls" alias', () => {
    showCommentsHelp('ls');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive comments list');
  });

  it('shows get help', () => {
    showCommentsHelp('get');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive comments get');
    expect(output).toContain('<id>');
  });

  it('shows add help for "add"', () => {
    showCommentsHelp('add');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive comments add');
    expect(output).toContain('--body');
    expect(output).toContain('--task');
  });

  it('shows add help for "create" alias', () => {
    showCommentsHelp('create');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive comments add');
  });

  it('shows update help', () => {
    showCommentsHelp('update');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive comments update');
    expect(output).toContain('--body');
  });
});
