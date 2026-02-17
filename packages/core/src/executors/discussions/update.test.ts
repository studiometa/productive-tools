import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../errors.js';
import { updateDiscussion } from './update.js';

describe('updateDiscussion', () => {
  it('updates discussion body', async () => {
    const mockResponse = {
      data: { id: '1', type: 'discussions', attributes: { body: 'Updated', status: 1 } },
    };
    const updateDiscussionApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { updateDiscussion: updateDiscussionApi } });

    const result = await updateDiscussion({ id: '1', body: 'Updated' }, ctx);

    expect(updateDiscussionApi).toHaveBeenCalledWith('1', { body: 'Updated' });
    expect(result.data).toEqual(mockResponse.data);
  });

  it('updates discussion title', async () => {
    const mockResponse = {
      data: { id: '1', type: 'discussions', attributes: { title: 'New Title', status: 1 } },
    };
    const updateDiscussionApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { updateDiscussion: updateDiscussionApi } });

    await updateDiscussion({ id: '1', title: 'New Title' }, ctx);

    expect(updateDiscussionApi).toHaveBeenCalledWith('1', { title: 'New Title' });
  });

  it('throws ExecutorValidationError when no fields provided', async () => {
    const ctx = createTestExecutorContext();

    await expect(updateDiscussion({ id: '1' }, ctx)).rejects.toThrow(ExecutorValidationError);
  });
});
