import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { updateComment } from './update.js';

describe('updateComment', () => {
  const mockComment = {
    id: '1',
    type: 'comments' as const,
    attributes: { body: 'Updated comment' },
  };

  it('updates comment body', async () => {
    const updateCommentApi = vi.fn().mockResolvedValue({ data: mockComment });
    const ctx = createTestExecutorContext({
      api: { updateComment: updateCommentApi },
    });

    const result = await updateComment({ id: '1', body: 'Updated comment' }, ctx);

    expect(updateCommentApi).toHaveBeenCalledWith('1', { body: 'Updated comment' });
    expect(result.data).toEqual(mockComment);
  });

  it('sends empty data when body is undefined', async () => {
    const updateCommentApi = vi.fn().mockResolvedValue({ data: mockComment });
    const ctx = createTestExecutorContext({
      api: { updateComment: updateCommentApi },
    });

    await updateComment({ id: '1' }, ctx);

    expect(updateCommentApi).toHaveBeenCalledWith('1', {});
  });
});
