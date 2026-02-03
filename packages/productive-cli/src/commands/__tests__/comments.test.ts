import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ProductiveApi } from '../../api.js';
import { handleCommentsCommand } from '../comments/index.js';

vi.mock('../../api.js', () => ({
  ProductiveApi: vi.fn(),
  ProductiveApiError: class ProductiveApiError extends Error {
    constructor(
      message: string,
      public statusCode?: number,
      public response?: unknown,
    ) {
      super(message);
      this.name = 'ProductiveApiError';
    }
  },
}));

vi.mock('../../output.js', () => ({
  OutputFormatter: vi.fn().mockImplementation((format, noColor) => ({
    format,
    noColor,
    output: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  })),
  createSpinner: vi.fn(() => ({
    start: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
  })),
}));

describe('comments command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('list command', () => {
    it('should list comments', async () => {
      const mockComments = {
        data: [
          {
            id: '1',
            attributes: {
              body: 'Test comment',
              commentable_type: 'Task',
              created_at: '2024-01-15T10:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
        included: [],
      };

      const mockApi = { getComments: vi.fn().mockResolvedValue(mockComments) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('list', [], {});

      expect(mockApi.getComments).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
        include: ['creator'],
      });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should filter by task', async () => {
      const mockComments = { data: [], meta: {}, included: [] };
      const mockApi = { getComments: vi.fn().mockResolvedValue(mockComments) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('list', [], { task: '123' });

      expect(mockApi.getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { task_id: '123' },
        }),
      );
    });

    it('should filter by deal', async () => {
      const mockComments = { data: [], meta: {}, included: [] };
      const mockApi = { getComments: vi.fn().mockResolvedValue(mockComments) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('list', [], { deal: '456' });

      expect(mockApi.getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { deal_id: '456' },
        }),
      );
    });

    it('should filter by project', async () => {
      const mockComments = { data: [], meta: {}, included: [] };
      const mockApi = { getComments: vi.fn().mockResolvedValue(mockComments) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('list', [], { project: '789' });

      expect(mockApi.getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { project_id: '789' },
        }),
      );
    });

    it('should filter by page', async () => {
      const mockComments = { data: [], meta: {}, included: [] };
      const mockApi = { getComments: vi.fn().mockResolvedValue(mockComments) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('list', [], { page: '101' });

      expect(mockApi.getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { page_id: '101' },
        }),
      );
    });

    it('should filter by discussion', async () => {
      const mockComments = { data: [], meta: {}, included: [] };
      const mockApi = { getComments: vi.fn().mockResolvedValue(mockComments) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('list', [], { discussion: '202' });

      expect(mockApi.getComments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { discussion_id: '202' },
        }),
      );
    });
  });

  describe('get command', () => {
    it('should get a comment by id', async () => {
      const mockComment = {
        data: {
          id: '1',
          attributes: {
            body: 'Test comment',
            commentable_type: 'Task',
            created_at: '2024-01-15T10:00:00Z',
          },
        },
        included: [],
      };

      const mockApi = { getComment: vi.fn().mockResolvedValue(mockComment) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('get', ['1'], {});

      expect(mockApi.getComment).toHaveBeenCalledWith('1', { include: ['creator'] });
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleCommentsCommand('get', [], {});
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });
  });

  describe('add command', () => {
    it('should create a comment on a task', async () => {
      const mockComment = {
        data: {
          id: '1',
          attributes: {
            body: 'New comment',
            commentable_type: 'Task',
            created_at: '2024-01-15T10:00:00Z',
          },
        },
      };

      const mockApi = { createComment: vi.fn().mockResolvedValue(mockComment) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('add', [], { body: 'New comment', task: '123' });

      expect(mockApi.createComment).toHaveBeenCalledWith({
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
      await handleCommentsCommand('add', [], { task: '123' });

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when no parent resource is provided', async () => {
      await handleCommentsCommand('add', [], { body: 'Comment without parent' });

      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should exit with error when multiple parent resources are provided', async () => {
      await handleCommentsCommand('add', [], { body: 'Comment', task: '123', deal: '456' });

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('update command', () => {
    it('should update a comment', async () => {
      const mockComment = { data: { id: '1', attributes: {} } };
      const mockApi = { updateComment: vi.fn().mockResolvedValue(mockComment) };
      vi.mocked(ProductiveApi).mockImplementation(() => mockApi as any);

      await handleCommentsCommand('update', ['1'], { body: 'Updated comment' });

      expect(mockApi.updateComment).toHaveBeenCalledWith('1', { body: 'Updated comment' });
    });

    it('should exit with error when id is missing', async () => {
      try {
        await handleCommentsCommand('update', [], { body: 'Updated' });
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should exit with error when no updates specified', async () => {
      await handleCommentsCommand('update', ['1'], {});

      expect(processExitSpy).toHaveBeenCalled();
    });
  });

  describe('unknown subcommand', () => {
    it('should exit with error for unknown subcommand', async () => {
      await handleCommentsCommand('unknown', [], {});

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
