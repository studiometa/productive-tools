import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { ExecutorValidationError } from '../errors.js';
import { updatePage } from './update.js';

describe('updatePage', () => {
  it('updates page title', async () => {
    const mockResponse = {
      data: { id: '1', type: 'pages', attributes: { title: 'Updated' } },
    };
    const updatePageApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { updatePage: updatePageApi } });

    const result = await updatePage({ id: '1', title: 'Updated' }, ctx);

    expect(updatePageApi).toHaveBeenCalledWith('1', { title: 'Updated' });
    expect(result.data).toEqual(mockResponse.data);
  });

  it('updates page body', async () => {
    const mockResponse = {
      data: { id: '1', type: 'pages', attributes: { body: 'New body' } },
    };
    const updatePageApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { updatePage: updatePageApi } });

    await updatePage({ id: '1', body: 'New body' }, ctx);

    expect(updatePageApi).toHaveBeenCalledWith('1', { body: 'New body' });
  });

  it('throws ExecutorValidationError when no fields provided', async () => {
    const ctx = createTestExecutorContext();

    await expect(updatePage({ id: '1' }, ctx)).rejects.toThrow(ExecutorValidationError);
  });
});
