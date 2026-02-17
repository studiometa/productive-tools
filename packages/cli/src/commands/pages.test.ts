import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../api.js';

import { createTestContext } from '../context.js';
import { pagesList, pagesGet } from './pages/handlers.js';
import { showPagesHelp } from './pages/help.js';

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
});

describe('pages command', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
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
    });
  });
});
