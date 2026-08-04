import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { attachmentsCommandConfig } from './command.js';
import { attachmentsList, attachmentsGet, attachmentsDelete } from './handlers.js';

describe('attachments command wiring', () => {
  it('uses "attachments" as resource name', () => {
    expect(attachmentsCommandConfig.resource).toBe('attachments');
  });

  it('wires list and ls to attachmentsList', () => {
    expect(attachmentsCommandConfig.handlers.list).toBe(attachmentsList);
    expect(attachmentsCommandConfig.handlers.ls).toBe(attachmentsList);
  });

  it('wires get to attachmentsGet as args handler', () => {
    expect(attachmentsCommandConfig.handlers.get).toEqual([attachmentsGet, 'args']);
  });

  it('wires delete and rm to attachmentsDelete as args handler', () => {
    expect(attachmentsCommandConfig.handlers.delete).toEqual([attachmentsDelete, 'args']);
    expect(attachmentsCommandConfig.handlers.rm).toEqual([attachmentsDelete, 'args']);
  });
});

describe('attachments command routing', () => {
  const mockAttachmentsList = vi.fn().mockResolvedValue(undefined);
  const mockAttachmentsGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockAttachmentsDelete = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'attachments',
    handlers: {
      list: mockAttachmentsList,
      ls: mockAttachmentsList,
      get: [mockAttachmentsGet, 'args'],
      delete: [mockAttachmentsDelete, 'args'],
      rm: [mockAttachmentsDelete, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockAttachmentsList.mockClear();
    mockAttachmentsGet.mockClear();
    mockAttachmentsDelete.mockClear();
  });

  it('routes "list" subcommand to attachmentsList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockAttachmentsList).toHaveBeenCalled();
  });

  it('routes "ls" alias to attachmentsList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockAttachmentsList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to attachmentsGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockAttachmentsGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "delete" subcommand to attachmentsDelete handler', async () => {
    await router('delete', ['123'], { format: 'json' });
    expect(mockAttachmentsDelete).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "rm" alias to attachmentsDelete handler', async () => {
    await router('rm', ['123'], { format: 'json' });
    expect(mockAttachmentsDelete).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown attachments subcommand: unknown'),
    );
  });
});
