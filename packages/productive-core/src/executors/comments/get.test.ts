import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from './../../context/test-utils.js';
import { getComment } from './get.js';

describe('getComment', () => {
  const mockComment = {
    id: '1',
    type: 'comments' as const,
    attributes: { body: 'Test comment' },
  };

  it('fetches a comment by ID', async () => {
    const getCommentApi = vi.fn().mockResolvedValue({ data: mockComment });
    const ctx = createTestExecutorContext({
      api: { getComment: getCommentApi },
    });

    const result = await getComment({ id: '1' }, ctx);

    expect(getCommentApi).toHaveBeenCalledWith('1', { include: undefined });
    expect(result.data).toEqual(mockComment);
  });
});
