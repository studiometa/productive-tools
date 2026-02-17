import { describe, it, expect, vi, afterEach } from 'vitest';

import { showDiscussionsHelp } from './help.js';

describe('showDiscussionsHelp', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows general help without subcommand', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showDiscussionsHelp();
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('productive discussions');
    expect(output).toContain('list');
    expect(output).toContain('resolve');
    expect(output).toContain('reopen');
  });

  it('shows list subcommand help', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showDiscussionsHelp('list');
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('discussions list');
    expect(output).toContain('--page-id');
    expect(output).toContain('--status');
  });

  it('shows resolve subcommand help', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showDiscussionsHelp('resolve');
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('discussions resolve');
  });

  it('shows reopen subcommand help', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showDiscussionsHelp('reopen');
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('discussions reopen');
  });

  it('shows add subcommand help', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    showDiscussionsHelp('add');
    const output = spy.mock.calls.flat().join('');
    expect(output).toContain('discussions add');
    expect(output).toContain('--body');
    expect(output).toContain('--page-id');
  });
});
