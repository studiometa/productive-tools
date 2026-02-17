import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { ExecutorValidationError } from '../../time/index.js';
import { updateCompany } from '../update.js';

describe('updateCompany', () => {
  const mockCompany = {
    id: '123',
    type: 'companies' as const,
    attributes: { name: 'Updated Corp' },
  };

  it('updates a company with provided fields', async () => {
    const updateCompanyApi = vi.fn().mockResolvedValue({ data: mockCompany });
    const ctx = createTestExecutorContext({ api: { updateCompany: updateCompanyApi } });

    const result = await updateCompany({ id: '123', name: 'Updated Corp' }, ctx);

    expect(updateCompanyApi).toHaveBeenCalledWith('123', { name: 'Updated Corp' });
    expect(result.data).toEqual(mockCompany);
  });

  it('throws validation error when no updates provided', async () => {
    const ctx = createTestExecutorContext();

    await expect(updateCompany({ id: '123' }, ctx)).rejects.toThrow(ExecutorValidationError);
    await expect(updateCompany({ id: '123' }, ctx)).rejects.toThrow('No updates specified');
  });

  it('maps all update fields', async () => {
    const updateCompanyApi = vi.fn().mockResolvedValue({ data: mockCompany });
    const ctx = createTestExecutorContext({ api: { updateCompany: updateCompanyApi } });

    await updateCompany(
      {
        id: '123',
        name: 'New Name',
        billingName: 'New Name Inc.',
        vat: 'FR12345678',
        defaultCurrency: 'EUR',
        companyCode: 'NN',
        domain: 'newname.com',
        dueDays: 30,
      },
      ctx,
    );

    expect(updateCompanyApi).toHaveBeenCalledWith('123', {
      name: 'New Name',
      billing_name: 'New Name Inc.',
      vat: 'FR12345678',
      default_currency: 'EUR',
      company_code: 'NN',
      domain: 'newname.com',
      due_days: 30,
    });
  });
});
