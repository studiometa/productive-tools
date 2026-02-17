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

    expect(getPageApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual(mockResponse.data);
    expect(result.included).toEqual([]);
  });
});
