import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { discussionsCommandConfig } from './command.js';
import {
  discussionsList, discussionsGet, discussionsAdd, discussionsUpdate, discussionsDelete, discussionsResolve, discussionsReopen } from './handlers.js';

describe('discussions command wiring', () => {
  it('uses "discussions" as resource name', () => {
    expect(discussionsCommandConfig.resource).toBe('discussions');
  });

  it('wires list and ls to discussionsList', () => {
    expect(discussionsCommandConfig.handlers.list).toBe(discussionsList);
    expect(discussionsCommandConfig.handlers.ls).toBe(discussionsList);
  });

  it('wires get to discussionsGet as args handler', () => {
    expect(discussionsCommandConfig.handlers.get).toEqual([discussionsGet, 'args']);
  });

  it('wires add and create to discussionsAdd', () => {
    expect(discussionsCommandConfig.handlers.add).toBe(discussionsAdd);
    expect(discussionsCommandConfig.handlers.create).toBe(discussionsAdd);
  });

  it('wires update to discussionsUpdate as args handler', () => {
    expect(discussionsCommandConfig.handlers.update).toEqual([discussionsUpdate, 'args']);
  });

  it('wires delete and rm to discussionsDelete as args handler', () => {
    expect(discussionsCommandConfig.handlers.delete).toEqual([discussionsDelete, 'args']);
    expect(discussionsCommandConfig.handlers.rm).toEqual([discussionsDelete, 'args']);
  });

  it('wires resolve to discussionsResolve as args handler', () => {
    expect(discussionsCommandConfig.handlers.resolve).toEqual([discussionsResolve, 'args']);
  });

  it('wires reopen to discussionsReopen as args handler', () => {
    expect(discussionsCommandConfig.handlers.reopen).toEqual([discussionsReopen, 'args']);
  });
});

describe('discussions command routing', () => {
  const mockDiscussionsList = vi.fn().mockResolvedValue(undefined);
  const mockDiscussionsGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockDiscussionsAdd = vi.fn().mockResolvedValue(undefined);
  const mockDiscussionsUpdate = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockDiscussionsDelete = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockDiscussionsResolve = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockDiscussionsReopen = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'discussions',
    handlers: {
      list: mockDiscussionsList,
      ls: mockDiscussionsList,
      get: [mockDiscussionsGet, 'args'],
      add: mockDiscussionsAdd,
      create: mockDiscussionsAdd,
      update: [mockDiscussionsUpdate, 'args'],
      delete: [mockDiscussionsDelete, 'args'],
      rm: [mockDiscussionsDelete, 'args'],
      resolve: [mockDiscussionsResolve, 'args'],
      reopen: [mockDiscussionsReopen, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockDiscussionsList.mockClear();
    mockDiscussionsGet.mockClear();
    mockDiscussionsAdd.mockClear();
    mockDiscussionsUpdate.mockClear();
    mockDiscussionsDelete.mockClear();
    mockDiscussionsResolve.mockClear();
    mockDiscussionsReopen.mockClear();
  });

  it('routes "list" subcommand to discussionsList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockDiscussionsList).toHaveBeenCalled();
  });

  it('routes "ls" alias to discussionsList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockDiscussionsList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to discussionsGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockDiscussionsGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "add" subcommand to discussionsAdd handler', async () => {
    await router('add', [], { format: 'json' });
    expect(mockDiscussionsAdd).toHaveBeenCalled();
  });

  it('routes "create" alias to discussionsAdd handler', async () => {
    await router('create', [], { format: 'json' });
    expect(mockDiscussionsAdd).toHaveBeenCalled();
  });

  it('routes "update" subcommand to discussionsUpdate handler', async () => {
    await router('update', ['123'], { format: 'json' });
    expect(mockDiscussionsUpdate).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "delete" subcommand to discussionsDelete handler', async () => {
    await router('delete', ['123'], { format: 'json' });
    expect(mockDiscussionsDelete).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "rm" alias to discussionsDelete handler', async () => {
    await router('rm', ['123'], { format: 'json' });
    expect(mockDiscussionsDelete).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "resolve" subcommand to discussionsResolve handler', async () => {
    await router('resolve', ['123'], { format: 'json' });
    expect(mockDiscussionsResolve).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "reopen" subcommand to discussionsReopen handler', async () => {
    await router('reopen', ['123'], { format: 'json' });
    expect(mockDiscussionsReopen).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown discussions subcommand: unknown'),
    );
  });
});
