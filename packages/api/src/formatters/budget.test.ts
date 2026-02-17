import { describe, it, expect } from 'vitest';

import { formatBudget } from './budget.js';

describe('formatBudget', () => {
  it('formats with all fields', () => {
    const result = formatBudget({
      id: '1',
      type: 'budgets',
      attributes: {
        name: 'Q1 Budget',
        budget_type: 1,
        billable: true,
        started_on: '2024-01-01',
        ended_on: '2024-03-31',
        currency: 'EUR',
        total_time_budget: 4800,
        remaining_time_budget: 2400,
        total_monetary_budget: 50000,
        remaining_monetary_budget: 25000,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-02-15T12:00:00Z',
      },
    });
    expect(result).toEqual({
      id: '1',
      name: 'Q1 Budget',
      budget_type: 1,
      billable: true,
      started_on: '2024-01-01',
      ended_on: '2024-03-31',
      currency: 'EUR',
      total_time_budget: 4800,
      remaining_time_budget: 2400,
      total_monetary_budget: 50000,
      remaining_monetary_budget: 25000,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-02-15T12:00:00Z',
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
    expect(result.name).toBeUndefined();
  });

  it('formats with no optional fields', () => {
    const result = formatBudget({ id: '3', type: 'budgets', attributes: {} });
    expect(result).toEqual({ id: '3', created_at: undefined, updated_at: undefined });
  });

  it('omits timestamps when includeTimestamps is false', () => {
    const result = formatBudget(
      {
        id: '4',
        type: 'budgets',
        attributes: {
          name: 'Test Budget',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-02-15T12:00:00Z',
        },
      },
      { includeTimestamps: false },
    );
    expect(result.name).toBe('Test Budget');
    expect(result.created_at).toBeUndefined();
    expect(result.updated_at).toBeUndefined();
  });

  it('includes timestamps by default', () => {
    const result = formatBudget({
      id: '5',
      type: 'budgets',
      attributes: {
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-02-15T12:00:00Z',
      },
    });
    expect(result.created_at).toBe('2024-01-01T00:00:00Z');
    expect(result.updated_at).toBe('2024-02-15T12:00:00Z');
  });

  it('formats name and budget_type fields', () => {
    const result = formatBudget({
      id: '6',
      type: 'budgets',
      attributes: {
        name: 'Development Budget',
        budget_type: 2,
        billable: false,
        currency: 'USD',
      },
    });
    expect(result.name).toBe('Development Budget');
    expect(result.budget_type).toBe(2);
    expect(result.billable).toBe(false);
    expect(result.currency).toBe('USD');
  });

  it('handles empty string values for date and currency fields', () => {
    const result = formatBudget({
      id: '7',
      type: 'budgets',
      attributes: {
        name: 'Budget with empty dates',
        started_on: '',
        ended_on: '',
        currency: '',
      },
    });
    expect(result.name).toBe('Budget with empty dates');
    expect(result.started_on).toBeUndefined();
    expect(result.ended_on).toBeUndefined();
    expect(result.currency).toBeUndefined();
  });

  it('handles null values for date and currency fields', () => {
    const result = formatBudget({
      id: '8',
      type: 'budgets',
      attributes: {
        name: 'Budget with null dates',
        started_on: null,
        ended_on: null,
        currency: null,
      },
    });
    expect(result.name).toBe('Budget with null dates');
    expect(result.started_on).toBeUndefined();
    expect(result.ended_on).toBeUndefined();
    expect(result.currency).toBeUndefined();
  });
});
