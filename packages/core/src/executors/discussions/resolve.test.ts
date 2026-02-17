import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { resolveDiscussion } from './resolve.js';

describe('resolveDiscussion', () => {
  it('resolves discussion by id', async () => {
    const mockResponse = {
      data: { id: '1', type: 'discussions', attributes: { status: 2, resolved_at: '2024-01-05' } },
    };
    const resolveDiscussionApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { resolveDiscussion: resolveDiscussionApi } });

    const result = await resolveDiscussion({ id: '1' }, ctx);

    expect(resolveDiscussionApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual(mockResponse.data);
  });
});
