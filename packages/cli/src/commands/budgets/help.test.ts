import { describe, it, expect, vi, afterEach } from 'vitest';

import { showBudgetsHelp } from './help.js';

describe('showBudgetsHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help with no argument', () => {
    showBudgetsHelp();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive budgets');
    expect(output).toContain('list, ls');
    expect(output).toContain('get <id>');
  });

  it('shows list help for "list"', () => {
    showBudgetsHelp('list');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive budgets list');
    expect(output).toContain('--project');
    expect(output).toContain('--company');
    expect(output).toContain('--deal');
    expect(output).toContain('--billable');
    expect(output).toContain('--budget-type');
  });

  it('shows list help for "ls" alias', () => {
    showBudgetsHelp('ls');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive budgets list');
  });

  it('shows get help', () => {
    showBudgetsHelp('get');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive budgets get');
    expect(output).toContain('<id>');
  });
});
