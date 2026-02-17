import { describe, it, expect } from 'vitest';

import { formatBudget } from './budget.js';

describe('formatBudget', () => {
  it('formats with all fields', () => {
    const result = formatBudget({
      id: '1',
      type: 'budgets',
      attributes: {
        total_time_budget: 4800,
        remaining_time_budget: 2400,
        total_monetary_budget: 50000,
        remaining_monetary_budget: 25000,
      },
    });
    expect(result).toEqual({
      id: '1',
      total_time_budget: 4800,
      remaining_time_budget: 2400,
      total_monetary_budget: 50000,
      remaining_monetary_budget: 25000,
    });
  });

  it('formats with partial fields', () => {
    const result = formatBudget({
      id: '2',
      type: 'budgets',
      attributes: { total_time_budget: 960 },
    });
    expect(result.id).toBe('2');
    expect(result.total_time_budget).toBe(960);
    expect(result.remaining_time_budget).toBeUndefined();
    expect(result.total_monetary_budget).toBeUndefined();
  });

  it('formats with no optional fields', () => {
    const result = formatBudget({ id: '3', type: 'budgets', attributes: {} });
    expect(result).toEqual({ id: '3' });
  });
});
