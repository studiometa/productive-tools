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
  });
});
