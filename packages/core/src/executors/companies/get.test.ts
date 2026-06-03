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

    expect(getCompanyApi).toHaveBeenCalledWith('1', { include: undefined });
    expect(result.data).toEqual(mockCompany);
  });

  it('forwards include and returns included (Finding 1)', async () => {
    const included = [{ id: '5', type: 'people', attributes: { first_name: 'Jane' } }];
    const getCompanyApi = vi.fn().mockResolvedValue({ data: mockCompany, included });
    const ctx = createTestExecutorContext({ api: { getCompany: getCompanyApi } });

    const result = await getCompany({ id: '1', include: ['contacts'] }, ctx);

    expect(getCompanyApi).toHaveBeenCalledWith('1', { include: ['contacts'] });
    expect(result.included).toEqual(included);
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
    expect(getCompanyApi).toHaveBeenCalledWith('1', { include: undefined });
  });
});
