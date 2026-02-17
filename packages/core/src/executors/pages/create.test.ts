import { describe, expect, it, vi } from 'vitest';

import { createTestExecutorContext } from '../../context/test-utils.js';
import { createPage } from './create.js';

describe('createPage', () => {
  it('creates a page with required fields', async () => {
    const mockResponse = {
      data: { id: '1', type: 'pages', attributes: { title: 'New Page' } },
    };
    const createPageApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { createPage: createPageApi } });

    const result = await createPage({ title: 'New Page', projectId: '100', body: 'Content' }, ctx);

    expect(createPageApi).toHaveBeenCalledWith({
      title: 'New Page',
      body: 'Content',
      project_id: '100',
      parent_page_id: undefined,
    });
    expect(result.data).toEqual(mockResponse.data);
  });

  it('resolves project ID through resolver', async () => {
    const mockResponse = {
      data: { id: '1', type: 'pages', attributes: { title: 'New Page' } },
    };
    const createPageApi = vi.fn().mockResolvedValue(mockResponse);
    const resolveValue = vi.fn().mockResolvedValue('200');
    const ctx = createTestExecutorContext({
      api: { createPage: createPageApi },
      resolver: { resolveValue },
    });

    await createPage({ title: 'New Page', projectId: 'my-project' }, ctx);

    expect(resolveValue).toHaveBeenCalledWith('my-project', 'project');
    expect(createPageApi).toHaveBeenCalledWith(expect.objectContaining({ project_id: '200' }));
  });

  it('passes parent page ID when provided', async () => {
    const mockResponse = {
      data: { id: '1', type: 'pages', attributes: { title: 'Sub Page' } },
    };
    const createPageApi = vi.fn().mockResolvedValue(mockResponse);
    const ctx = createTestExecutorContext({ api: { createPage: createPageApi } });

    await createPage({ title: 'Sub Page', projectId: '100', parentPageId: '5' }, ctx);

    expect(createPageApi).toHaveBeenCalledWith(expect.objectContaining({ parent_page_id: '5' }));
  });
});
