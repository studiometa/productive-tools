import { describe, it, expect, vi, afterEach } from 'vitest';

import { showCompaniesHelp } from './help.js';

describe('showCompaniesHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help with no argument', () => {
    showCompaniesHelp();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive companies');
    expect(output).toContain('list, ls');
    expect(output).toContain('get');
    expect(output).toContain('add, create');
    expect(output).toContain('update');
  });

  it('shows list help for "list"', () => {
    showCompaniesHelp('list');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive companies list');
    expect(output).toContain('--archived');
    expect(output).toContain('--sort');
  });

  it('shows list help for "ls" alias', () => {
    showCompaniesHelp('ls');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive companies list');
  });

  it('shows get help', () => {
    showCompaniesHelp('get');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive companies get');
    expect(output).toContain('<id>');
  });

  it('shows add help for "add"', () => {
    showCompaniesHelp('add');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive companies add');
    expect(output).toContain('--name');
    expect(output).toContain('--vat');
  });

  it('shows add help for "create" alias', () => {
    showCompaniesHelp('create');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive companies add');
  });

  it('shows update help', () => {
    showCompaniesHelp('update');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive companies update');
    expect(output).toContain('--name');
    expect(output).toContain('--currency');
  });
});
