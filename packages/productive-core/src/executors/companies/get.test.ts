import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getCompany } from './get.js';

describe('getCompany', () => {
  const mockCompany = {
    id: '1',
    type: 'companies' as const,
    attributes: { name: 'Acme Corp' },
  };

  it('fetches a company by ID', async () => {
    const getCompanyApi = vi.fn().mockResolvedValue({ data: mockCompany });
    const ctx = createTestExecutorContext({
      api: { getCompany: getCompanyApi },
    });

    const result = await getCompany({ id: '1' }, ctx);

    expect(getCompanyApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual(mockCompany);
  });

  it('resolves non-numeric ID before fetching', async () => {
    const getCompanyApi = vi.fn().mockResolvedValue({ data: mockCompany });
    const resolveValue = vi.fn().mockResolvedValue('1');
    const ctx = createTestExecutorContext({
      api: { getCompany: getCompanyApi },
      resolver: { resolveValue },
    });

    await getCompany({ id: 'Acme Corp' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('Acme Corp', 'company');
    expect(getCompanyApi).toHaveBeenCalledWith('1');
  });
});
