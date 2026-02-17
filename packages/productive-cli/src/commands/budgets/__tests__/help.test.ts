import { describe, it, expect, vi, afterEach } from 'vitest';

import { showBudgetsHelp } from '../help.js';

describe('showBudgetsHelp', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('shows general help with no argument', () => {
    showBudgetsHelp();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive budgets');
    expect(output).toContain('list, ls');
  });

  it('shows list help for "list"', () => {
    showBudgetsHelp('list');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive budgets list');
    expect(output).toContain('--project');
    expect(output).toContain('--company');
  });

  it('shows list help for "ls" alias', () => {
    showBudgetsHelp('ls');
    const output = spy.mock.calls[0][0];
    expect(output).toContain('productive budgets list');
  });
});
