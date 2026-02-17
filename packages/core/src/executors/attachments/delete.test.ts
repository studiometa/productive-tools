import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { deleteAttachment } from './delete.js';

describe('deleteAttachment', () => {
  it('deletes and returns confirmation', async () => {
    const deleteApi = vi.fn().mockResolvedValue(undefined);
    const ctx = createTestExecutorContext({ api: { deleteAttachment: deleteApi } });

    const result = await deleteAttachment({ id: '42' }, ctx);

    expect(deleteApi).toHaveBeenCalledWith('42');
    expect(result.data).toEqual({ deleted: true, id: '42' });
  });
});
