import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../time/index.js';
import { updateDeal } from './update.js';

describe('updateDeal', () => {
  const mockDeal = {
    id: '123',
    type: 'deals' as const,
    attributes: { name: 'Updated Deal' },
  };

  it('updates a deal with provided fields', async () => {
    const updateDealApi = vi.fn().mockResolvedValue({ data: mockDeal });
    const ctx = createTestExecutorContext({ api: { updateDeal: updateDealApi } });

    const result = await updateDeal({ id: '123', name: 'Updated Deal' }, ctx);

    expect(updateDealApi).toHaveBeenCalledWith('123', { name: 'Updated Deal' });
    expect(result.data).toEqual(mockDeal);
  });

  it('throws validation error when no updates provided', async () => {
    const ctx = createTestExecutorContext();

    await expect(updateDeal({ id: '123' }, ctx)).rejects.toThrow(ExecutorValidationError);
  });

  it('maps all update fields', async () => {
    const updateDealApi = vi.fn().mockResolvedValue({ data: mockDeal });
    const ctx = createTestExecutorContext({ api: { updateDeal: updateDealApi } });

    await updateDeal(
      {
        id: '123',
        name: 'New name',
        date: '2026-03-01',
        endDate: '2026-06-30',
        responsibleId: '500',
        dealStatusId: '3',
      },
      ctx,
    );

    expect(updateDealApi).toHaveBeenCalledWith('123', {
      name: 'New name',
      date: '2026-03-01',
      end_date: '2026-06-30',
      responsible_id: '500',
      deal_status_id: '3',
    });
  });
});
