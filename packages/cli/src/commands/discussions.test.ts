import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../api.js';

import { createTestContext } from '../context.js';
import { discussionsList, discussionsGet } from './discussions/handlers.js';
import { showDiscussionsHelp } from './discussions/help.js';

describe('showDiscussionsHelp', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows general help', () => {
    showDiscussionsHelp();
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('productive discussions');
  });

  it('shows ls alias help', () => {
    showDiscussionsHelp('ls');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('discussions list');
  });
});

describe('discussions command', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  describe('discussionsList', () => {
    it('should list discussions', async () => {
      const getDiscussions = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'discussions',
            attributes: {
              title: 'Review needed',
              body: '<p>Check this</p>',
              status: 1,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-02T00:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      });

      const ctx = createTestContext({
        api: { getDiscussions } as unknown as ProductiveApi,
      });

      await discussionsList(ctx);

      expect(getDiscussions).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          perPage: 100,
        }),
      );
    });

    it('should filter by status', async () => {
      const getDiscussions = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getDiscussions } as unknown as ProductiveApi,
        options: { status: 'active', format: 'json' },
      });

      await discussionsList(ctx);

      expect(getDiscussions).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { status: '1' },
        }),
      );
    });

    it('should filter by page-id', async () => {
      const getDiscussions = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getDiscussions } as unknown as ProductiveApi,
        options: { 'page-id': '123', format: 'json' },
      });

      await discussionsList(ctx);

      expect(getDiscussions).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { page_id: '123' },
        }),
      );
    });
  });

  describe('discussionsGet', () => {
    it('should get a discussion by ID', async () => {
      const getDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: {
            title: 'Test Discussion',
            body: 'Body content',
            status: 1,
          },
        },
      });

      const ctx = createTestContext({
        api: { getDiscussion } as unknown as ProductiveApi,
      });

      await discussionsGet(['1'], ctx);

      expect(getDiscussion).toHaveBeenCalledWith('1');
    });
  });
});
