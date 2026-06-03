import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getPage } from './get.js';

describe('getPage', () => {
  it('calls getPage with id', async () => {
    const mockResponse = {
      data: { id: '1', type: 'pages', attributes: { title: 'Page 1' } },
      included: [],
    };
    const getPageApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getPage: getPageApi } });

    const result = await getPage({ id: '1' }, ctx);

    expect(getPageApi).toHaveBeenCalledWith('1', { include: undefined });
    expect(result.data).toEqual(mockResponse.data);
    expect(result.included).toEqual([]);
  });

  it('forwards include (Finding 3)', async () => {
    const included = [{ id: '7', type: 'people', attributes: { first_name: 'Jane' } }];
    const getPageApi = vi.fn().mockResolvedValue({
      data: { id: '1', type: 'pages', attributes: {} },
      included,
    });
    const ctx = createTestExecutorContext({ api: { getPage: getPageApi } });

    const result = await getPage({ id: '1', include: ['creator'] }, ctx);

    expect(getPageApi).toHaveBeenCalledWith('1', { include: ['creator'] });
    expect(result.included).toEqual(included);
  });
});
