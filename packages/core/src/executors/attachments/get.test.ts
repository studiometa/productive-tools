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

    expect(getAttachmentApi).toHaveBeenCalledWith('1');
    expect(result.data).toEqual(mockAttachment);
  });
});
