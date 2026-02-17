import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../api.js';

import { createTestContext } from '../context.js';
import {
  discussionsList,
  discussionsGet,
  discussionsAdd,
  discussionsUpdate,
  discussionsDelete,
  discussionsResolve,
  discussionsReopen,
} from './discussions/handlers.js';
import { showDiscussionsHelp } from './discussions/help.js';
import { handleDiscussionsCommand } from './discussions/index.js';

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

  it('shows get help', () => {
    showDiscussionsHelp('get');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('discussions get');
  });

  it('shows add help', () => {
    showDiscussionsHelp('add');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('discussions add');
  });

  it('shows update help', () => {
    showDiscussionsHelp('update');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('discussions update');
  });

  it('shows delete help', () => {
    showDiscussionsHelp('delete');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('discussions delete');
  });

  it('shows resolve help', () => {
    showDiscussionsHelp('resolve');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('discussions resolve');
  });

  it('shows reopen help', () => {
    showDiscussionsHelp('reopen');
    const output = consoleLogSpy.mock.calls.flat().join('');
    expect(output).toContain('discussions reopen');
  });
});

describe('discussions command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
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
      expect(consoleLogSpy).toHaveBeenCalled();
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

    it('should filter by page_id (underscore variant)', async () => {
      const getDiscussions = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getDiscussions } as unknown as ProductiveApi,
        options: { page_id: '456', format: 'json' },
      });

      await discussionsList(ctx);

      expect(getDiscussions).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { page_id: '456' },
        }),
      );
    });

    it('should pass additional filters', async () => {
      const getDiscussions = vi.fn().mockResolvedValue({ data: [], meta: { total: 0 } });

      const ctx = createTestContext({
        api: { getDiscussions } as unknown as ProductiveApi,
        options: { filter: 'creator_id=user1', 'page-id': '123', format: 'json' },
      });

      await discussionsList(ctx);

      expect(getDiscussions).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.objectContaining({ page_id: '123', creator_id: 'user1' }),
        }),
      );
    });

    it('should list discussions in csv format', async () => {
      const getDiscussions = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'discussions',
            attributes: { body: 'Content', status: 1 },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getDiscussions } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await discussionsList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list discussions with short format option f', async () => {
      const getDiscussions = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'discussions',
            attributes: { body: 'Content', status: 1 },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getDiscussions } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await discussionsList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list discussions in table format', async () => {
      const getDiscussions = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'discussions',
            attributes: { body: 'Content', status: 1 },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getDiscussions } as unknown as ProductiveApi,
        options: { format: 'table' },
      });

      await discussionsList(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
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
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a discussion in json format', async () => {
      const getDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { body: 'Content', status: 1 },
        },
      });

      const ctx = createTestContext({
        api: { getDiscussion } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await discussionsGet(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a discussion in human format', async () => {
      const getDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: {
            title: 'Human Format Test',
            body: 'Content body',
            status: 1,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { getDiscussion } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await discussionsGet(['1'], ctx);

      expect(getDiscussion).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should get a discussion with short format option f', async () => {
      const getDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { body: 'Content', status: 1 },
        },
      });

      const ctx = createTestContext({
        api: { getDiscussion } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await discussionsGet(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await discussionsGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('discussionsAdd', () => {
    it('should create a discussion', async () => {
      const createDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { body: 'Review', status: 1, title: 'Review Request' },
        },
      });

      const ctx = createTestContext({
        api: { createDiscussion } as unknown as ProductiveApi,
        options: { body: 'Review', 'page-id': '123', title: 'Review Request', format: 'json' },
      });

      await discussionsAdd(ctx);

      expect(createDiscussion).toHaveBeenCalledWith({
        body: 'Review',
        page_id: '123',
        title: 'Review Request',
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a discussion without title', async () => {
      const createDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { body: 'Review', status: 1 },
        },
      });

      const ctx = createTestContext({
        api: { createDiscussion } as unknown as ProductiveApi,
        options: { body: 'Review', 'page-id': '123', format: 'json' },
      });

      await discussionsAdd(ctx);

      expect(createDiscussion).toHaveBeenCalledWith({
        body: 'Review',
        page_id: '123',
        title: undefined,
      });
    });

    it('should create a discussion in human format', async () => {
      const createDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { body: 'Review', status: 1, title: 'Title' },
        },
      });

      const ctx = createTestContext({
        api: { createDiscussion } as unknown as ProductiveApi,
        options: { body: 'Review', 'page-id': '123', title: 'Title', format: 'human' },
      });

      await discussionsAdd(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a discussion with short format option f', async () => {
      const createDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { body: 'Review', status: 1 },
        },
      });

      const ctx = createTestContext({
        api: { createDiscussion } as unknown as ProductiveApi,
        options: { body: 'Review', 'page-id': '123', f: 'json' },
      });

      await discussionsAdd(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create a discussion without title in human format', async () => {
      const createDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { body: 'Review', status: 1 },
        },
      });

      const ctx = createTestContext({
        api: { createDiscussion } as unknown as ProductiveApi,
        options: { body: 'Review', 'page-id': '123', format: 'human' },
      });

      await discussionsAdd(ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when body is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { 'page-id': '123', format: 'json' },
      });

      await discussionsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when page-id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { body: 'Review', format: 'json' },
      });

      await discussionsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('discussionsUpdate', () => {
    it('should update a discussion title', async () => {
      const updateDiscussion = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'discussions', attributes: { title: 'Updated', status: 1 } },
      });

      const ctx = createTestContext({
        api: { updateDiscussion } as unknown as ProductiveApi,
        options: { title: 'Updated', format: 'json' },
      });

      await discussionsUpdate(['1'], ctx);

      expect(updateDiscussion).toHaveBeenCalledWith('1', { title: 'Updated', body: undefined });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update a discussion body', async () => {
      const updateDiscussion = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'discussions', attributes: { status: 1 } },
      });

      const ctx = createTestContext({
        api: { updateDiscussion } as unknown as ProductiveApi,
        options: { body: 'New body content', format: 'json' },
      });

      await discussionsUpdate(['1'], ctx);

      expect(updateDiscussion).toHaveBeenCalledWith('1', {
        title: undefined,
        body: 'New body content',
      });
    });

    it('should update a discussion in human format', async () => {
      const updateDiscussion = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'discussions', attributes: { status: 1 } },
      });

      const ctx = createTestContext({
        api: { updateDiscussion } as unknown as ProductiveApi,
        options: { title: 'Updated', format: 'human' },
      });

      await discussionsUpdate(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should update a discussion with short format option f', async () => {
      const updateDiscussion = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'discussions', attributes: { status: 1 } },
      });

      const ctx = createTestContext({
        api: { updateDiscussion } as unknown as ProductiveApi,
        options: { title: 'Updated', f: 'json' },
      });

      await discussionsUpdate(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { title: 'Updated', format: 'json' },
      });

      try {
        await discussionsUpdate([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const updateDiscussion = vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('No updates'), { name: 'ExecutorValidationError' }),
        );

      const ctx = createTestContext({
        api: { updateDiscussion } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await discussionsUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should rethrow non-ExecutorValidationError errors', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const networkError = new Error('Network error');
      const updateDiscussion = vi.fn().mockRejectedValue(networkError);

      const ctx = createTestContext({
        api: { updateDiscussion } as unknown as ProductiveApi,
        options: { title: 'Updated', format: 'json' },
      });

      await discussionsUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('discussionsDelete', () => {
    it('should delete a discussion', async () => {
      const deleteDiscussion = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deleteDiscussion } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await discussionsDelete(['1'], ctx);

      expect(deleteDiscussion).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should delete a discussion in human format', async () => {
      const deleteDiscussion = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deleteDiscussion } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await discussionsDelete(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should delete a discussion with short format option f', async () => {
      const deleteDiscussion = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deleteDiscussion } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await discussionsDelete(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext();

      try {
        await discussionsDelete([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('discussionsResolve', () => {
    it('should resolve a discussion', async () => {
      const resolveDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { status: 2, resolved_at: '2024-01-05' },
        },
      });

      const ctx = createTestContext({
        api: { resolveDiscussion } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await discussionsResolve(['1'], ctx);

      expect(resolveDiscussion).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should resolve a discussion in human format', async () => {
      const resolveDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { status: 2, resolved_at: '2024-01-05' },
        },
      });

      const ctx = createTestContext({
        api: { resolveDiscussion } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await discussionsResolve(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should resolve a discussion with short format option f', async () => {
      const resolveDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { status: 2, resolved_at: '2024-01-05' },
        },
      });

      const ctx = createTestContext({
        api: { resolveDiscussion } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await discussionsResolve(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext();

      try {
        await discussionsResolve([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('discussionsReopen', () => {
    it('should reopen a discussion', async () => {
      const reopenDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { status: 1, resolved_at: null },
        },
      });

      const ctx = createTestContext({
        api: { reopenDiscussion } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await discussionsReopen(['1'], ctx);

      expect(reopenDiscussion).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should reopen a discussion in human format', async () => {
      const reopenDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { status: 1, resolved_at: null },
        },
      });

      const ctx = createTestContext({
        api: { reopenDiscussion } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await discussionsReopen(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should reopen a discussion with short format option f', async () => {
      const reopenDiscussion = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'discussions',
          attributes: { status: 1, resolved_at: null },
        },
      });

      const ctx = createTestContext({
        api: { reopenDiscussion } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await discussionsReopen(['1'], ctx);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext();

      try {
        await discussionsReopen([], ctx);
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

      await handleDiscussionsCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
