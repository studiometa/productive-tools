import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { createComment } from './create.js';

describe('createComment', () => {
  const mockComment = {
    id: '999',
    type: 'comments' as const,
    attributes: { body: 'Test comment', commentable_type: 'Task' },
  };

  it('creates a comment on a task', async () => {
    const createCommentApi = vi.fn().mockResolvedValue({ data: mockComment });
    const ctx = createTestExecutorContext({ api: { createComment: createCommentApi } });

    const result = await createComment({ body: 'Test comment', taskId: '100' }, ctx);

    expect(createCommentApi).toHaveBeenCalledWith({
      body: 'Test comment',
      task_id: '100',
      deal_id: undefined,
    });
    expect(result.data).toEqual(mockComment);
  });

  it('creates a comment on a deal', async () => {
    const createCommentApi = vi.fn().mockResolvedValue({ data: mockComment });
    const ctx = createTestExecutorContext({ api: { createComment: createCommentApi } });

    await createComment({ body: 'Deal note', dealId: '200' }, ctx);

    expect(createCommentApi).toHaveBeenCalledWith({
      body: 'Deal note',
      task_id: undefined,
      deal_id: '200',
    });
  });
});
