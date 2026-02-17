import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { deleteDiscussion } from './delete.js';

describe('deleteDiscussion', () => {
  it('deletes discussion by id', async () => {
    const deleteDiscussionApi = vi.fn().mockResolvedValue(undefined);
    const ctx = createTestExecutorContext({ api: { deleteDiscussion: deleteDiscussionApi } });

    const result = await deleteDiscussion({ id: '1' }, ctx);

    expect(deleteDiscussionApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual({ deleted: true, id: '1' });
  });
});
