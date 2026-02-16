import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../../api.js';

import { createTestContext } from '../../context.js';
import { commentsList, commentsGet, commentsAdd, commentsUpdate } from '../comments/handlers.js';
import { handleCommentsCommand } from '../comments/index.js';

describe('comments command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('commentsList', () => {
    it('should list comments', async () => {
      const getComments = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'comments',
            attributes: {
              body: 'Test comment',
              commentable_type: 'Task',
              created_at: '2024-01-15T10:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
        included: [],
      });

      const ctx = createTestContext({
        api: { getComments } as unknown as ProductiveApi,
      });

      await commentsList(ctx);

      expect(getComments).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        include: ['creator'],
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should filter by task', async () => {
      const getComments = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getComments } as unknown as ProductiveApi,
        options: { task: '123', format: 'json' },
      });

      await commentsList(ctx);

      expect(getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { task_id: '123' },
        }),
      );
    });

    it('should filter by deal', async () => {
      const getComments = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getComments } as unknown as ProductiveApi,
        options: { deal: '456', format: 'json' },
      });

      await commentsList(ctx);

      expect(getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { deal_id: '456' },
        }),
      );
    });

    it('should filter by project', async () => {
      const getComments = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getComments } as unknown as ProductiveApi,
        options: { project: '789', format: 'json' },
      });

      await commentsList(ctx);

      expect(getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { project_id: '789' },
        }),
      );
    });

    it('should filter by discussion', async () => {
      const getComments = vi.fn().mockResolvedValue({ data: [], meta: {}, included: [] });

      const ctx = createTestContext({
        api: { getComments } as unknown as ProductiveApi,
        options: { discussion: '202', format: 'json' },
      });

      await commentsList(ctx);

      expect(getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { discussion_id: '202' },
        }),
      );
    });
  });

  describe('commentsGet', () => {
    it('should get a comment by id', async () => {
      const getComment = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'comments',
          attributes: {
            body: 'Test comment',
            commentable_type: 'Task',
            created_at: '2024-01-15T10:00:00Z',
          },
        },
        included: [],
      });

      const ctx = createTestContext({
        api: { getComment } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await commentsGet(['1'], ctx);

      expect(getComment).toHaveBeenCalledWith('1', { include: ['creator'] });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await commentsGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('commentsAdd', () => {
    it('should create a comment on a task', async () => {
      const createComment = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'comments',
          attributes: {
            body: 'New comment',
            commentable_type: 'Task',
            created_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { createComment } as unknown as ProductiveApi,
        options: { body: 'New comment', task: '123', format: 'json' },
      });

      await commentsAdd(ctx);

      expect(createComment).toHaveBeenCalledWith({
        body: 'New comment',
        task_id: '123',
        deal_id: undefined,
        company_id: undefined,
        invoice_id: undefined,
        person_id: undefined,
        discussion_id: undefined,
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when body is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { task: '123', format: 'json' },
      });

      await commentsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when no parent resource is provided', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { body: 'Comment without parent', format: 'json' },
      });

      await commentsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when multiple parent resources are provided', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { body: 'Comment', task: '123', deal: '456', format: 'json' },
      });

      await commentsAdd(ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('commentsUpdate', () => {
    it('should update a comment', async () => {
      const updateComment = vi.fn().mockResolvedValue({
        data: { id: '1', type: 'comments', attributes: {} },
      });

      const ctx = createTestContext({
        api: { updateComment } as unknown as ProductiveApi,
        options: { body: 'Updated comment', format: 'json' },
      });

      await commentsUpdate(['1'], ctx);

      expect(updateComment).toHaveBeenCalledWith('1', { body: 'Updated comment' });
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { body: 'Updated', format: 'json' },
      });

      try {
        await commentsUpdate([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const ctx = createTestContext({
        options: { format: 'json' },
      });

      await commentsUpdate(['1'], ctx);

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleCommentsCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
