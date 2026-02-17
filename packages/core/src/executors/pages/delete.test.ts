import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { deletePage } from './delete.js';

describe('deletePage', () => {
  it('deletes page by id', async () => {
    const deletePageApi = vi.fn().mockResolvedValue(undefined);
    const ctx = createTestExecutorContext({ api: { deletePage: deletePageApi } });

    const result = await deletePage({ id: '1' }, ctx);

    expect(deletePageApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual({ deleted: true, id: '1' });
  });
});
