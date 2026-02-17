import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { createDiscussion } from './create.js';

describe('createDiscussion', () => {
  it('creates a discussion with required fields', async () => {
    const mockResponse = {
      data: { id: '1', type: 'discussions', attributes: { body: 'New', status: 1 } },
    };
    const createDiscussionApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { createDiscussion: createDiscussionApi } });

    const result = await createDiscussion(
      { body: 'New discussion', pageId: '10', title: 'Topic' },
      ctx,
    );

    expect(createDiscussionApi).toHaveBeenCalledWith({
      body: 'New discussion',
      page_id: '10',
      title: 'Topic',
    });
    expect(result.data).toEqual(mockResponse.data);
  });

  it('creates without title', async () => {
    const mockResponse = {
      data: { id: '2', type: 'discussions', attributes: { body: 'Simple', status: 1 } },
    };
    const createDiscussionApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { createDiscussion: createDiscussionApi } });

    await createDiscussion({ body: 'Simple', pageId: '10' }, ctx);

    expect(createDiscussionApi).toHaveBeenCalledWith({
      body: 'Simple',
      page_id: '10',
      title: undefined,
    });
  });
});
