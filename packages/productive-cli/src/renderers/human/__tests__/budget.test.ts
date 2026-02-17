import { describe, it, expect, vi, afterEach } from 'vitest';

import type { RenderContext } from '../../types.js';

import { HumanBudgetListRenderer } from '../budget.js';

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
