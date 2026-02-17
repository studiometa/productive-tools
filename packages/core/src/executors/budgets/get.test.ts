import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getBudget } from './get.js';

describe('getBudget', () => {
  const mockBudget = {
    id: '1',
    type: 'budgets' as const,
    attributes: { name: 'Q1 Budget', total_time_budget: 4800 },
  };

  it('fetches a budget by ID', async () => {
    const getBudgetApi = vi.fn().mockResolvedValue({ data: mockBudget });
    const ctx = createTestExecutorContext({
      api: { getBudget: getBudgetApi },
    });

    const result = await getBudget({ id: '1' }, ctx);

    expect(getBudgetApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual(mockBudget);
  });

  it('returns data without meta', async () => {
    const getBudgetApi = vi.fn().mockResolvedValue({ data: mockBudget });
    const ctx = createTestExecutorContext({
      api: { getBudget: getBudgetApi },
    });

    const result = await getBudget({ id: '42' }, ctx);

    expect(result.meta).toBeUndefined();
    expect(result.data.id).toBe('1');
  });
});
