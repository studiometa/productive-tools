import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { pagesCommandConfig } from './command.js';
import { pagesList, pagesGet, pagesAdd, pagesUpdate, pagesDelete } from './handlers.js';

describe('pages command wiring', () => {
  it('uses "pages" as resource name', () => {
    expect(pagesCommandConfig.resource).toBe('pages');
  });

  it('wires list and ls to pagesList', () => {
    expect(pagesCommandConfig.handlers.list).toBe(pagesList);
    expect(pagesCommandConfig.handlers.ls).toBe(pagesList);
  });

  it('wires get to pagesGet as args handler', () => {
    expect(pagesCommandConfig.handlers.get).toEqual([pagesGet, 'args']);
  });

  it('wires add and create to pagesAdd', () => {
    expect(pagesCommandConfig.handlers.add).toBe(pagesAdd);
    expect(pagesCommandConfig.handlers.create).toBe(pagesAdd);
  });

  it('wires update to pagesUpdate as args handler', () => {
    expect(pagesCommandConfig.handlers.update).toEqual([pagesUpdate, 'args']);
  });

  it('wires delete and rm to pagesDelete as args handler', () => {
    expect(pagesCommandConfig.handlers.delete).toEqual([pagesDelete, 'args']);
    expect(pagesCommandConfig.handlers.rm).toEqual([pagesDelete, 'args']);
  });
});

describe('pages command routing', () => {
  const mockPagesList = vi.fn().mockResolvedValue(undefined);
  const mockPagesGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockPagesAdd = vi.fn().mockResolvedValue(undefined);
  const mockPagesUpdate = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockPagesDelete = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'pages',
    handlers: {
      list: mockPagesList,
      ls: mockPagesList,
      get: [mockPagesGet, 'args'],
      add: mockPagesAdd,
      create: mockPagesAdd,
      update: [mockPagesUpdate, 'args'],
      delete: [mockPagesDelete, 'args'],
      rm: [mockPagesDelete, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockPagesList.mockClear();
    mockPagesGet.mockClear();
    mockPagesAdd.mockClear();
    mockPagesUpdate.mockClear();
    mockPagesDelete.mockClear();
  });

  it('routes "list" subcommand to pagesList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockPagesList).toHaveBeenCalled();
  });

  it('routes "ls" alias to pagesList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockPagesList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to pagesGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockPagesGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "add" subcommand to pagesAdd handler', async () => {
    await router('add', [], { format: 'json' });
    expect(mockPagesAdd).toHaveBeenCalled();
  });

  it('routes "create" alias to pagesAdd handler', async () => {
    await router('create', [], { format: 'json' });
    expect(mockPagesAdd).toHaveBeenCalled();
  });

  it('routes "update" subcommand to pagesUpdate handler', async () => {
    await router('update', ['123'], { format: 'json' });
    expect(mockPagesUpdate).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "delete" subcommand to pagesDelete handler', async () => {
    await router('delete', ['123'], { format: 'json' });
    expect(mockPagesDelete).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "rm" alias to pagesDelete handler', async () => {
    await router('rm', ['123'], { format: 'json' });
    expect(mockPagesDelete).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown pages subcommand: unknown'),
    );
  });
});
