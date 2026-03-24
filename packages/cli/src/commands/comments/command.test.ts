import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { commentsCommandConfig } from './command.js';
import { commentsList, commentsGet, commentsAdd, commentsUpdate } from './handlers.js';

describe('comments command wiring', () => {
  it('uses "comments" as resource name', () => {
    expect(commentsCommandConfig.resource).toBe('comments');
  });

  it('wires list and ls to commentsList', () => {
    expect(commentsCommandConfig.handlers.list).toBe(commentsList);
    expect(commentsCommandConfig.handlers.ls).toBe(commentsList);
  });

  it('wires get to commentsGet as args handler', () => {
    expect(commentsCommandConfig.handlers.get).toEqual([commentsGet, 'args']);
  });

  it('wires add and create to commentsAdd', () => {
    expect(commentsCommandConfig.handlers.add).toBe(commentsAdd);
    expect(commentsCommandConfig.handlers.create).toBe(commentsAdd);
  });

  it('wires update to commentsUpdate as args handler', () => {
    expect(commentsCommandConfig.handlers.update).toEqual([commentsUpdate, 'args']);
  });
});

describe('comments command routing', () => {
  const mockCommentsList = vi.fn().mockResolvedValue(undefined);
  const mockCommentsGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockCommentsAdd = vi.fn().mockResolvedValue(undefined);
  const mockCommentsUpdate = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'comments',
    handlers: {
      list: mockCommentsList,
      ls: mockCommentsList,
      get: [mockCommentsGet, 'args'],
      add: mockCommentsAdd,
      create: mockCommentsAdd,
      update: [mockCommentsUpdate, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockCommentsList.mockClear();
    mockCommentsGet.mockClear();
    mockCommentsAdd.mockClear();
    mockCommentsUpdate.mockClear();
  });

  it('routes "list" subcommand to commentsList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockCommentsList).toHaveBeenCalled();
  });

  it('routes "ls" alias to commentsList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockCommentsList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to commentsGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockCommentsGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "add" subcommand to commentsAdd handler', async () => {
    await router('add', [], { format: 'json' });
    expect(mockCommentsAdd).toHaveBeenCalled();
  });

  it('routes "create" alias to commentsAdd handler', async () => {
    await router('create', [], { format: 'json' });
    expect(mockCommentsAdd).toHaveBeenCalled();
  });

  it('routes "update" subcommand to commentsUpdate handler', async () => {
    await router('update', ['123'], { format: 'json' });
    expect(mockCommentsUpdate).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown comments subcommand: unknown'),
    );
  });
});
