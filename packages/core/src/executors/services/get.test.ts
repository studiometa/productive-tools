import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getService } from './get.js';

describe('getService', () => {
  const mockService = {
    id: '42',
    type: 'services' as const,
    attributes: {
      name: 'Development',
      budgeted_time: 4800,
      worked_time: 2400,
      billing_type_id: 2,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-15T00:00:00Z',
    },
  };

  it('returns the service from API', async () => {
    const getServiceApi = vi.fn().mockResolvedValue({ data: mockService });
    const ctx = createTestExecutorContext({ api: { getService: getServiceApi } });

    const result = await getService({ id: '42' }, ctx);

    expect(getServiceApi).toHaveBeenCalledWith('42', { include: undefined });
    expect(result.data).toEqual(mockService);
  });

  it('forwards include parameter to API', async () => {
    const included = [{ id: '1', type: 'deals', attributes: { name: 'Deal 1' } }];
    const getServiceApi = vi.fn().mockResolvedValue({ data: mockService, included });
    const ctx = createTestExecutorContext({ api: { getService: getServiceApi } });

    const result = await getService({ id: '42', include: ['deal'] }, ctx);

    expect(getServiceApi).toHaveBeenCalledWith('42', { include: ['deal'] });
    expect(result.included).toEqual(included);
  });
});
