import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { createDeal } from './create.js';

describe('createDeal', () => {
  const mockDeal = {
    id: '999',
    type: 'deals' as const,
    attributes: { name: 'New Deal' },
  };

  it('resolves company ID before creating', async () => {
    const createDealApi = vi.fn().mockResolvedValue({ data: mockDeal });
    const resolveValue = vi.fn().mockResolvedValue('100');
    const ctx = createTestExecutorContext({
      api: { createDeal: createDealApi },
      resolver: { resolveValue },
    });

    const result = await createDeal({ name: 'New Deal', companyId: 'Acme Corp' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('Acme Corp', 'company');
    expect(createDealApi).toHaveBeenCalledWith({
      name: 'New Deal',
      company_id: '100',
    });
    expect(result.data).toEqual(mockDeal);
  });

  it('resolves responsibleId when provided', async () => {
    const createDealApi = vi.fn().mockResolvedValue({ data: mockDeal });
    const resolveValue = vi
      .fn()
      .mockResolvedValueOnce('100') // company
      .mockResolvedValueOnce('200'); // responsible
    const ctx = createTestExecutorContext({
      api: { createDeal: createDealApi },
      resolver: { resolveValue },
    });

    await createDeal({ name: 'Deal', companyId: 'Acme', responsibleId: 'John Doe' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('John Doe', 'person');
    expect(createDealApi).toHaveBeenCalledWith(expect.objectContaining({ responsible_id: '200' }));
  });

  it('passes optional fields (date, budget)', async () => {
    const createDealApi = vi.fn().mockResolvedValue({ data: mockDeal });
    const ctx = createTestExecutorContext({
      api: { createDeal: createDealApi },
    });

    await createDeal(
      { name: 'Budget Deal', companyId: '100', date: '2026-03-01', budget: true },
      ctx,
    );

    expect(createDealApi).toHaveBeenCalledWith({
      name: 'Budget Deal',
      company_id: '100',
      date: '2026-03-01',
      budget: true,
      responsible_id: undefined,
    });
  });

  it('passes through numeric company ID without resolving', async () => {
    const createDealApi = vi.fn().mockResolvedValue({ data: mockDeal });
    const resolveValue = vi.fn().mockResolvedValue('100');
    const ctx = createTestExecutorContext({
      api: { createDeal: createDealApi },
      resolver: { resolveValue },
    });

    await createDeal({ name: 'Deal', companyId: '100' }, ctx);

    // noopResolver returns '100' unchanged, but resolveValue is still called
    expect(resolveValue).toHaveBeenCalledWith('100', 'company');
    expect(createDealApi).toHaveBeenCalledWith({
      name: 'Deal',
      company_id: '100',
    });
  });
});
