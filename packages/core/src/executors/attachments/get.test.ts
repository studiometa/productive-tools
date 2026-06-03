import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { getAttachment } from './get.js';

describe('getAttachment', () => {
  it('returns attachment data', async () => {
    const mockAttachment = {
      id: '1',
      type: 'attachments',
      attributes: { name: 'file.png', size: 1024 },
    };
    const getAttachmentApi = vi.fn().mockResolvedValue({ data: mockAttachment });
    const ctx = createTestExecutorContext({ api: { getAttachment: getAttachmentApi } });

    const result = await getAttachment({ id: '1' }, ctx);

    expect(getAttachmentApi).toHaveBeenCalledWith('1', { include: undefined });
    expect(result.data).toEqual(mockAttachment);
  });

  it('forwards include and returns included (Finding 1)', async () => {
    const included = [{ id: '7', type: 'tasks', attributes: { title: 'Task' } }];
    const getAttachmentApi = vi.fn().mockResolvedValue({
      data: { id: '1', type: 'attachments', attributes: {} },
      included,
    });
    const ctx = createTestExecutorContext({ api: { getAttachment: getAttachmentApi } });

    const result = await getAttachment({ id: '1', include: ['task'] }, ctx);

    expect(getAttachmentApi).toHaveBeenCalledWith('1', { include: ['task'] });
    expect(result.included).toEqual(included);
  });
});
