import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../types.js';

import { HumanBudgetListRenderer, HumanBudgetDetailRenderer } from './budget.js';

const ctx: RenderContext = { format: 'human', verbose: false, links: false };

describe('HumanBudgetListRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders a list of budgets', () => {
    new HumanBudgetListRenderer().render(
      {
        data: [
          {
            id: '1',
            name: 'Q1 Budget',
            total_time_budget: 4800,
            remaining_time_budget: 2400,
            total_monetary_budget: 50000,
            remaining_monetary_budget: 25000,
          },
        ],
        meta: { page: 1, total_pages: 2, total_count: 10 },
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders over-budget scenario', () => {
    new HumanBudgetListRenderer().render(
      {
        data: [
          {
            id: '1',
            total_time_budget: 100,
            remaining_time_budget: -50,
            total_monetary_budget: 1000,
            remaining_monetary_budget: -200,
          },
        ],
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
  });

  it('renders budget with missing fields', () => {
    new HumanBudgetListRenderer().render({ data: [{ id: '1' }] }, ctx);
    expect(spy).toHaveBeenCalled();
  });

  it('renders empty list', () => {
    new HumanBudgetListRenderer().render({ data: [] }, ctx);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('HumanBudgetDetailRenderer', () => {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it('renders budget detail with all fields', () => {
    new HumanBudgetDetailRenderer().render(
      {
        id: '1',
        name: 'Q1 Budget',
        billable: true,
        started_on: '2024-01-01',
        ended_on: '2024-03-31',
        currency: 'EUR',
        total_time_budget: 4800,
        remaining_time_budget: 2400,
        total_monetary_budget: 50000,
        remaining_monetary_budget: 25000,
        created_at: '2024-01-01T00:00:00Z',
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('Q1 Budget');
    expect(output).toContain('Billable:');
    expect(output).toContain('Yes');
    expect(output).toContain('Start date:');
    expect(output).toContain('Currency:');
    expect(output).toContain('Time:');
    expect(output).toContain('Cost:');
    expect(output).toContain('Created:');
  });

  it('renders budget detail with minimal fields', () => {
    new HumanBudgetDetailRenderer().render({ id: '2' }, ctx);
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('Untitled Budget');
    expect(output).toContain('2');
  });

  it('renders with noColor option', () => {
    const noColorCtx: RenderContext = {
      format: 'human',
      verbose: false,
      links: false,
      noColor: true,
    };
    new HumanBudgetDetailRenderer().render(
      {
        id: '3',
        name: 'Test Budget',
        billable: false,
        total_time_budget: 100,
        remaining_time_budget: -10,
        total_monetary_budget: 5000,
        remaining_monetary_budget: -100,
      },
      noColorCtx,
    );
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(output).toContain('No');
    expect(output).toContain('remaining:');
  });

  it('renders budget without optional date/currency fields', () => {
    new HumanBudgetDetailRenderer().render(
      {
        id: '4',
        name: 'Simple Budget',
        total_time_budget: 480,
        remaining_time_budget: 240,
      },
      ctx,
    );
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Simple Budget');
    expect(output).toContain('Time:');
    expect(output).not.toContain('Start date:');
    expect(output).not.toContain('Currency:');
  });
});
