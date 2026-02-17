import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { buildAttachmentFilters, listAttachments } from './list.js';

describe('buildAttachmentFilters', () => {
  it('maps typed options to API filter names', () => {
    const filters = buildAttachmentFilters({
      taskId: '100',
      commentId: '200',
      pageId: '300',
      dealId: '400',
    });
    expect(filters).toEqual({
      task_id: '100',
      comment_id: '200',
      page_id: '300',
      deal_id: '400',
    });
  });

  it('returns empty filter for empty options', () => {
    expect(buildAttachmentFilters({})).toEqual({});
  });

  it('merges additionalFilters', () => {
    const filters = buildAttachmentFilters({
      taskId: '100',
      additionalFilters: { custom: 'value' },
    });
    expect(filters.task_id).toBe('100');
    expect(filters.custom).toBe('value');
  });
});

describe('listAttachments', () => {
  const mockResponse = {
    data: [
      {
        id: '1',
        type: 'attachments',
        attributes: { name: 'file.png', size: 1024 },
      },
    ],
    meta: { current_page: 1, total_pages: 1 },
  };

  it('passes filters and pagination to API', async () => {
    const getAttachments = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getAttachments } });

    await listAttachments({ taskId: '100', page: 2, perPage: 50 }, ctx);

    expect(getAttachments).toHaveBeenCalledWith({
      page: 2,
      perPage: 50,
      filter: { task_id: '100' },
    });
  });

  it('uses default pagination', async () => {
    const getAttachments = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getAttachments } });

    await listAttachments({}, ctx);

    expect(getAttachments).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 100 }));
  });

  it('returns data and meta', async () => {
    const getAttachments = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { getAttachments } });

    const result = await listAttachments({}, ctx);

    expect(result.data).toEqual(mockResponse.data);
    expect(result.meta).toEqual(mockResponse.meta);
  });
});
