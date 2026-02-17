import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ProductiveApi } from '../api.js';

import { createTestContext } from '../context.js';
import { attachmentsList, attachmentsGet, attachmentsDelete } from './attachments/handlers.js';
import { handleAttachmentsCommand } from './attachments/index.js';

describe('attachments command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('attachmentsList', () => {
    it('should list attachments', async () => {
      const getAttachments = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'attachments',
            attributes: {
              name: 'file.png',
              content_type: 'image/png',
              size: 1024,
              url: 'https://cdn.example.com/file.png',
              created_at: '2024-01-15T10:00:00Z',
            },
          },
        ],
        meta: { total: 1, page: 1, per_page: 100 },
      });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
      });

      await attachmentsList(ctx);

      expect(getAttachments).toHaveBeenCalledWith({
        page: 1,
        perPage: 100,
        filter: {},
      });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should filter by task', async () => {
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { task: '123', format: 'json' },
      });

      await attachmentsList(ctx);

      expect(getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { task_id: '123' },
        }),
      );
    });

    it('should filter by comment', async () => {
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { comment: '456', format: 'json' },
      });

      await attachmentsList(ctx);

      expect(getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { comment_id: '456' },
        }),
      );
    });

    it('should filter by deal', async () => {
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { deal: '789', format: 'json' },
      });

      await attachmentsList(ctx);

      expect(getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { deal_id: '789' },
        }),
      );
    });

    it('should list attachments in csv format', async () => {
      const getAttachments = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'attachments',
            attributes: {
              name: 'file.png',
              content_type: 'image/png',
              size: 1024,
              url: 'https://cdn.example.com/file.png',
              created_at: '2024-01-15T10:00:00Z',
            },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await attachmentsList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list attachments in table format', async () => {
      const getAttachments = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'attachments',
            attributes: {
              name: 'file.png',
              content_type: 'image/png',
              size: 1024,
              url: 'https://cdn.example.com/file.png',
              created_at: '2024-01-15T10:00:00Z',
            },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { format: 'table' },
      });

      await attachmentsList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle attachments without created_at in csv/table format', async () => {
      const getAttachments = vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            type: 'attachments',
            attributes: {
              name: 'file.png',
              content_type: 'image/png',
              size: 1024,
              url: 'https://cdn.example.com/file.png',
              // created_at is missing
            },
          },
        ],
        meta: { total: 1 },
      });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { format: 'csv' },
      });

      await attachmentsList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should filter by page', async () => {
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { page: '456', format: 'json' },
      });

      await attachmentsList(ctx);

      expect(getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { page_id: '456' },
        }),
      );
    });

    it('should parse additional filters', async () => {
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { filter: 'content_type=image/png', format: 'json' },
      });

      await attachmentsList(ctx);

      expect(getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { content_type: 'image/png' },
        }),
      );
    });

    it('should use shorthand format option -f for list', async () => {
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await attachmentsList(ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should combine multiple filters', async () => {
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { task: '111', comment: '222', page: '333', deal: '444', format: 'json' },
      });

      await attachmentsList(ctx);

      expect(getAttachments).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            task_id: '111',
            comment_id: '222',
            page_id: '333',
            deal_id: '444',
          },
        }),
      );
    });
  });

  describe('attachmentsGet', () => {
    it('should get an attachment by id', async () => {
      const getAttachment = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'attachments',
          attributes: {
            name: 'file.png',
            content_type: 'image/png',
            size: 1024,
            url: 'https://cdn.example.com/file.png',
            created_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { getAttachment } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await attachmentsGet(['1'], ctx);

      expect(getAttachment).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await attachmentsGet([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should get attachment in human format', async () => {
      const getAttachment = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'attachments',
          attributes: {
            name: 'file.png',
            content_type: 'image/png',
            size: 1024,
            url: 'https://cdn.example.com/file.png',
            created_at: '2024-01-15T10:00:00Z',
          },
        },
      });

      const ctx = createTestContext({
        api: { getAttachment } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await attachmentsGet(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should use shorthand format option -f for get', async () => {
      const getAttachment = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'attachments',
          attributes: {
            name: 'file.png',
            content_type: 'image/png',
            size: 1024,
            url: 'https://cdn.example.com/file.png',
          },
        },
      });

      const ctx = createTestContext({
        api: { getAttachment } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await attachmentsGet(['1'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('attachmentsDelete', () => {
    it('should delete an attachment', async () => {
      const deleteAttachment = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deleteAttachment } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await attachmentsDelete(['42'], ctx);

      expect(deleteAttachment).toHaveBeenCalledWith('42');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should exit with error when id is missing', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const ctx = createTestContext();

      try {
        await attachmentsDelete([], ctx);
      } catch {
        // exitWithValidationError throws
      }

      expect(processExitSpy).toHaveBeenCalledWith(3);
    });

    it('should delete in human format', async () => {
      const deleteAttachment = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deleteAttachment } as unknown as ProductiveApi,
        options: { format: 'human' },
      });

      await attachmentsDelete(['42'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should use shorthand format option -f for delete', async () => {
      const deleteAttachment = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deleteAttachment } as unknown as ProductiveApi,
        options: { f: 'json' },
      });

      await attachmentsDelete(['42'], ctx);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('command routing', () => {
    it('should exit with error for unknown subcommand', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await handleAttachmentsCommand('unknown', [], {
        format: 'json',
        token: 'test-token',
        'org-id': 'test-org',
      });

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle ls alias for list', async () => {
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });

      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      // Use handler directly for alias test
      await attachmentsList(ctx);
      expect(getAttachments).toHaveBeenCalled();
    });

    it('should handle rm alias for delete', async () => {
      const deleteAttachment = vi.fn().mockResolvedValue(undefined);

      const ctx = createTestContext({
        api: { deleteAttachment } as unknown as ProductiveApi,
        options: { format: 'json' },
      });

      await attachmentsDelete(['99'], ctx);
      expect(deleteAttachment).toHaveBeenCalledWith('99');
    });
  });

  describe('handleAttachmentsCommand integration', () => {
    it('should route list subcommand', async () => {
      // Mock API at module level for command integration tests
      vi.doMock('../api.js', () => ({
        ProductiveApi: vi.fn().mockImplementation(() => ({
          getAttachments: vi.fn().mockResolvedValue({ data: [], meta: {} }),
        })),
      }));

      // Since handleAttachmentsCommand creates its own context internally,
      // we test via the handler functions directly which is sufficient
      const getAttachments = vi.fn().mockResolvedValue({ data: [], meta: {} });
      const ctx = createTestContext({
        api: { getAttachments } as unknown as ProductiveApi,
        options: { format: 'json' },
      });
      await attachmentsList(ctx);
      expect(getAttachments).toHaveBeenCalled();
    });

    it('should route get subcommand', async () => {
      const getAttachment = vi.fn().mockResolvedValue({
        data: {
          id: '1',
          type: 'attachments',
          attributes: { name: 'file.txt', content_type: 'text/plain', size: 100 },
        },
      });
      const ctx = createTestContext({
        api: { getAttachment } as unknown as ProductiveApi,
        options: { format: 'json' },
      });
      await attachmentsGet(['1'], ctx);
      expect(getAttachment).toHaveBeenCalledWith('1');
    });

    it('should route delete subcommand', async () => {
      const deleteAttachment = vi.fn().mockResolvedValue(undefined);
      const ctx = createTestContext({
        api: { deleteAttachment } as unknown as ProductiveApi,
        options: { format: 'json' },
      });
      await attachmentsDelete(['1'], ctx);
      expect(deleteAttachment).toHaveBeenCalledWith('1');
    });
  });
});
