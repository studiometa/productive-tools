import { describe, it, expect, vi, afterEach } from 'vitest';

import { showAttachmentsHelp } from './help.js';

describe('showAttachmentsHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help with no argument', () => {
    showAttachmentsHelp();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive attachments');
    expect(output).toContain('list, ls');
    expect(output).toContain('get');
    expect(output).toContain('delete, rm');
  });

  it('shows list help for "list"', () => {
    showAttachmentsHelp('list');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive attachments list');
    expect(output).toContain('--task');
    expect(output).toContain('--comment');
    expect(output).toContain('--deal');
  });

  it('shows list help for "ls" alias', () => {
    showAttachmentsHelp('ls');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive attachments list');
  });

  it('shows get help', () => {
    showAttachmentsHelp('get');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive attachments get');
    expect(output).toContain('<id>');
  });

  it('shows delete help for "delete"', () => {
    showAttachmentsHelp('delete');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive attachments delete');
    expect(output).toContain('<id>');
  });

  it('shows delete help for "rm" alias', () => {
    showAttachmentsHelp('rm');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive attachments delete');
  });
});
