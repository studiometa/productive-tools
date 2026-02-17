import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { getDeal } from './get.js';

describe('getDeal', () => {
  const mockDeal = {
    id: '1',
    type: 'deals' as const,
    attributes: { name: 'Big Deal' },
  };
  const mockIncluded = [{ id: '10', type: 'companies', attributes: { name: 'Acme' } }];

  it('fetches a deal by ID with default includes', async () => {
    const getDealApi = vi.fn().mockResolvedValue({ data: mockDeal, included: mockIncluded });
    const ctx = createTestExecutorContext({
      api: { getDeal: getDealApi },
    });

    const result = await getDeal({ id: '1' }, ctx);

    expect(getDealApi).toHaveBeenCalledWith('1', {
      include: ['company', 'deal_status', 'responsible', 'project'],
    });
    expect(result.data).toEqual(mockDeal);
    expect(result.included).toEqual(mockIncluded);
  });

  it('uses custom includes when provided', async () => {
    const getDealApi = vi.fn().mockResolvedValue({ data: mockDeal, included: [] });
    const ctx = createTestExecutorContext({
      api: { getDeal: getDealApi },
    });

    await getDeal({ id: '1', include: ['company'] }, ctx);

    expect(getDealApi).toHaveBeenCalledWith('1', { include: ['company'] });
  });

  it('resolves non-numeric ID before fetching', async () => {
    const getDealApi = vi.fn().mockResolvedValue({ data: mockDeal, included: [] });
    const resolveValue = vi.fn().mockResolvedValue('1');
    const ctx = createTestExecutorContext({
      api: { getDeal: getDealApi },
      resolver: { resolveValue },
    });

    await getDeal({ id: 'D-123' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('D-123', 'deal');
    expect(getDealApi).toHaveBeenCalledWith('1', expect.any(Object));
  });
});
