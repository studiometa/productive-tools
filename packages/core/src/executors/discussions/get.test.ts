import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getDiscussion } from './get.js';

describe('getDiscussion', () => {
  it('calls getDiscussion with id', async () => {
    const mockResponse = {
      data: { id: '1', type: 'discussions', attributes: { body: 'Test', status: 1 } },
      included: [],
    };
    const getDiscussionApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getDiscussion: getDiscussionApi } });

    const result = await getDiscussion({ id: '1' }, ctx);

    expect(getDiscussionApi).toHaveBeenCalledWith('1', { include: undefined });
    expect(result.data).toEqual(mockResponse.data);
    expect(result.included).toEqual([]);
  });

  it('forwards include (Finding 3)', async () => {
    const included = [{ id: '7', type: 'pages', attributes: { title: 'Page' } }];
    const getDiscussionApi = vi.fn().mockResolvedValue({
      data: { id: '1', type: 'discussions', attributes: {} },
      included,
    });
    const ctx = createTestExecutorContext({ api: { getDiscussion: getDiscussionApi } });

    const result = await getDiscussion({ id: '1', include: ['page'] }, ctx);

    expect(getDiscussionApi).toHaveBeenCalledWith('1', { include: ['page'] });
    expect(result.included).toEqual(included);
  });
});
