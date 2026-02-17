import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../api.js';

import { createTestContext } from '../context.js';
import { pagesList, pagesGet, pagesAdd, pagesUpdate, pagesDelete } from './pages/handlers.js';
import { showPagesHelp } from './pages/help.js';
import { handlePagesCommand } from './pages/index.js';

describe('showPagesHelp', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows general help', () => {
    showPagesHelp();
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('productive pages');
  });

  it('shows ls alias help', () => {
    showPagesHelp('ls');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('pages list');
  });

  it('shows get help', () => {
    showPagesHelp('get');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('pages get');
  });

  it('shows add help', () => {
    showPagesHelp('add');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('pages add');
  });

  it('shows update help', () => {
    showPagesHelp('update');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('pages update');
  });

  it('shows delete help', () => {
    showPagesHelp('delete');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('pages delete');
  });
});

describe('pages command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  describe('pagesList', () => {
    it('should list pages', async () => {
      const getPages = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'pages',
            attributes: {
              title: 'Getting Started',
              body: '<p>Welcome</p>',
              public: false,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      });

      const ctx = createTestContext({
        api: { getPages } as unknown as ProductiveApi,
      });

      await pagesList(ctx);

      expect(getPages).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          perPage: 100,
        }),
      );
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should filter by project', async () => {
      const getPages = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getPages } as unknown as ProductiveApi,
        options: { project: '123', format: 'json' },
      });

      await pagesList(ctx);

      expect(getPages).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { project_id: '123' },
        }),
      );
    });

    it('should filter by creator', async () => {
      const getPages = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getPages } as unknown as ProductiveApi,
        options: { creator: 'person-1', format: 'json' },
      });

      await pagesList(ctx);

      expect(getPages).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { creator_id: 'person-1' },
        }),
      );
    });

    it('should pass additional filters', async () => {
      const getPages = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getPages } as unknown as ProductiveApi,
        options: { filter: 'public=true', project: '123', format: 'json' },
      });

      await pagesList(ctx);

      expect(getPages).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ project_id: '123', public: 'true' }),
        }),
      );
    });

    it('should list pages in csv format', async () => {
      const getPages = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'pages',
            attributes: { title: 'Page 1', body: 'Content' },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getPages } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await pagesList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list pages with short format option f', async () => {
      const getPages = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'pages',
            attributes: { title: 'Page 1' },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getPages } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await pagesList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list pages in table format', async () => {
      const getPages = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'pages',
            attributes: { title: 'Page 1' },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getPages } as unknown as ProductiveApi,
        options: { format: 'table' },
      });

      await pagesList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('pagesGet', () => {
    it('should get a page by ID', async () => {
      const getPage = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'pages',
          attributes: {
            title: 'Test Page',
            body: 'Content',
            public: false,
          },
        },
      });

      const ctx = createTestContext({
        api: { getPage } as unknown as ProductiveApi,
      });

      await pagesGet(['1'], ctx);

      expect(getPage).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a page in json format', async () => {
      const getPage = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'pages',
          attributes: { title: 'Test Page', body: 'Body' },
        },
      });

      const ctx = createTestContext({
        api: { getPage } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await pagesGet(['1'], ctx);

      expect(getPage).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a page in human format', async () => {
      const getPage = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'pages',
          attributes: {
            title: 'Human Format Page',
            body: 'Body content',
            public: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { getPage } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await pagesGet(['1'], ctx);

      expect(getPage).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a page with short format option f', async () => {
      const getPage = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'pages',
          attributes: { title: 'Test Page' },
        },
      });

      const ctx = createTestContext({
        api: { getPage } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await pagesGet(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await pagesGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('pagesAdd', () => {
    it('should create a page', async () => {
      const createPage = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'pages',
          attributes: { title: 'New Page', body: 'Body' },
        },
      });

      const ctx = createTestContext({
        api: { createPage } as unknown as ProductiveApi,
        options: { title: 'New Page', project: '123', body: 'Body', format: 'json' },
      });

      await pagesAdd(ctx);

      expect(createPage).toHaveBeenCalledWith({
        title: 'New Page',
        project_id: '123',
        body: 'Body',
        parent_page_id: undefined,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a page with parent page', async () => {
      const createPage = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'pages',
          attributes: { title: 'Child Page' },
        },
      });

      const ctx = createTestContext({
        api: { createPage } as unknown as ProductiveApi,
        options: {
          title: 'Child Page',
          project: '123',
          'parent-page': '10',
          format: 'json',
        },
      });

      await pagesAdd(ctx);

      expect(createPage).toHaveBeenCalledWith({
        title: 'Child Page',
        project_id: '123',
        body: undefined,
        parent_page_id: '10',
      });
    });

    it('should create a page in human format', async () => {
      const createPage = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'pages',
          attributes: { title: 'New Page' },
        },
      });

      const ctx = createTestContext({
        api: { createPage } as unknown as ProductiveApi,
        options: { title: 'New Page', project: '123', format: 'human' },
      });

      await pagesAdd(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a page with short format option f', async () => {
      const createPage = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'pages',
          attributes: { title: 'New Page' },
        },
      });

      const ctx = createTestContext({
        api: { createPage } as unknown as ProductiveApi,
        options: { title: 'New Page', project: '123', f: 'json' },
      });

      await pagesAdd(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when title is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { project: '123', format: 'json' },
      });

      await pagesAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when project is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { title: 'New Page', format: 'json' },
      });

      await pagesAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('pagesUpdate', () => {
    it('should update a page title', async () => {
      const updatePage = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'pages', attributes: { title: 'Updated' } },
      });

      const ctx = createTestContext({
        api: { updatePage } as unknown as ProductiveApi,
        options: { title: 'Updated', format: 'json' },
      });

      await pagesUpdate(['1'], ctx);

      expect(updatePage).toHaveBeenCalledWith('1', { title: 'Updated', body: undefined });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update a page body', async () => {
      const updatePage = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'pages', attributes: {} },
      });

      const ctx = createTestContext({
        api: { updatePage } as unknown as ProductiveApi,
        options: { body: 'New body content', format: 'json' },
      });

      await pagesUpdate(['1'], ctx);

      expect(updatePage).toHaveBeenCalledWith('1', { title: undefined, body: 'New body content' });
    });

    it('should update a page in human format', async () => {
      const updatePage = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'pages', attributes: {} },
      });

      const ctx = createTestContext({
        api: { updatePage } as unknown as ProductiveApi,
        options: { title: 'Updated', format: 'human' },
      });

      await pagesUpdate(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update a page with short format option f', async () => {
      const updatePage = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'pages', attributes: {} },
      });

      const ctx = createTestContext({
        api: { updatePage } as unknown as ProductiveApi,
        options: { title: 'Updated', f: 'json' },
      });

      await pagesUpdate(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { title: 'Updated', format: 'json' },
      });

      try {
        await pagesUpdate([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const updatePage = vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('No updates'), { name: 'ExecutorValidationError' }),
        );

      const ctx = createTestContext({
        api: { updatePage } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await pagesUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should rethrow non-ExecutorValidationError errors', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const networkError = new Error('Network error');
      const updatePage = vi.fn().mockRejectedValue(networkError);

      const ctx = createTestContext({
        api: { updatePage } as unknown as ProductiveApi,
        options: { title: 'Updated', format: 'json' },
      });

      await pagesUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('pagesDelete', () => {
    it('should delete a page', async () => {
      const deletePage = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deletePage } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await pagesDelete(['1'], ctx);

      expect(deletePage).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should delete a page in human format', async () => {
      const deletePage = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deletePage } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await pagesDelete(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should delete a page with short format option f', async () => {
      const deletePage = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deletePage } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await pagesDelete(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext();

      try {
        await pagesDelete([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handlePagesCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
