import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../../context/test-utils.js';
import { createCompany } from '../create.js';

describe('createCompany', () => {
  const mockCompany = {
    id: '1',
    type: 'companies' as const,
    attributes: { name: 'Acme Corp' },
  };

  it('creates a company with required fields', async () => {
    const createCompanyApi = vi.fn().mockResolvedValue({ data: mockCompany });
    const ctx = createTestExecutorContext({
      api: { createCompany: createCompanyApi },
    });

    const result = await createCompany({ name: 'Acme Corp' }, ctx);

    expect(createCompanyApi).toHaveBeenCalledWith({
      name: 'Acme Corp',
      billing_name: undefined,
      vat: undefined,
      default_currency: undefined,
      company_code: undefined,
      domain: undefined,
      due_days: undefined,
    });
    expect(result.data).toEqual(mockCompany);
  });

  it('passes all optional fields', async () => {
    const createCompanyApi = vi.fn().mockResolvedValue({ data: mockCompany });
    const ctx = createTestExecutorContext({
      api: { createCompany: createCompanyApi },
    });

    await createCompany(
      {
        name: 'Acme Corp',
        billingName: 'Acme Billing',
        vat: 'FR123456789',
        defaultCurrency: 'EUR',
        companyCode: 'ACME',
        domain: 'acme.com',
        dueDays: 30,
      },
      ctx,
    );

    expect(createCompanyApi).toHaveBeenCalledWith({
      name: 'Acme Corp',
      billing_name: 'Acme Billing',
      vat: 'FR123456789',
      default_currency: 'EUR',
      company_code: 'ACME',
      domain: 'acme.com',
      due_days: 30,
    });
  });
});
