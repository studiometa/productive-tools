import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { reopenDiscussion } from './reopen.js';

describe('reopenDiscussion', () => {
  it('reopens discussion by id', async () => {
    const mockResponse = {
      data: { id: '1', type: 'discussions', attributes: { status: 1, resolved_at: null } },
    };
    const reopenDiscussionApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { reopenDiscussion: reopenDiscussionApi } });

    const result = await reopenDiscussion({ id: '1' }, ctx);

    expect(reopenDiscussionApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual(mockResponse.data);
  });
});
