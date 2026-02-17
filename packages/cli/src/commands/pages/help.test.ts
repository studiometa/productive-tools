import { describe, it, expect, vi, afterEach } from 'vitest';

import { showPagesHelp } from './help.js';

describe('showPagesHelp', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows general help without subcommand', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showPagesHelp();
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('productive pages');
    expect(output).toContain('list');
    expect(output).toContain('get');
    expect(output).toContain('delete');
  });

  it('shows list subcommand help', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showPagesHelp('list');
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('pages list');
    expect(output).toContain('--project');
  });

  it('shows get subcommand help', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showPagesHelp('get');
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('pages get');
    expect(output).toContain('<id>');
  });

  it('shows add subcommand help', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showPagesHelp('add');
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('pages add');
    expect(output).toContain('--title');
  });

  it('shows delete subcommand help', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showPagesHelp('delete');
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('pages delete');
  });
});
