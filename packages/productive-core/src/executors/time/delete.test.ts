import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { deleteTimeEntry } from './delete.js';

describe('deleteTimeEntry', () => {
  it('deletes and returns confirmation', async () => {
    const deleteApi = vi.fn().mockResolvedValue(undefined);
    const ctx = createTestExecutorContext({ api: { deleteTimeEntry: deleteApi } });

    const result = await deleteTimeEntry({ id: '42' }, ctx);

    expect(deleteApi).toHaveBeenCalledWith('42');
    expect(result.data).toEqual({ deleted: true, id: '42' });
  });
});
