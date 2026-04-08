import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { timeCommandConfig } from './command.js';
import { timeList, timeGet, timeAdd, timeUpdate, timeDelete } from './handlers.js';

describe('time command wiring', () => {
  it('uses "time" as resource name', () => {
    expect(timeCommandConfig.resource).toBe('time');
  });

  it('wires list and ls to timeList', () => {
    expect(timeCommandConfig.handlers.list).toBe(timeList);
    expect(timeCommandConfig.handlers.ls).toBe(timeList);
  });

  it('wires get to timeGet as args handler', () => {
    expect(timeCommandConfig.handlers.get).toEqual([timeGet, 'args']);
  });

  it('wires add to timeAdd', () => {
    expect(timeCommandConfig.handlers.add).toBe(timeAdd);
  });

  it('wires update to timeUpdate as args handler', () => {
    expect(timeCommandConfig.handlers.update).toEqual([timeUpdate, 'args']);
  });

  it('wires delete and rm to timeDelete as args handler', () => {
    expect(timeCommandConfig.handlers.delete).toEqual([timeDelete, 'args']);
    expect(timeCommandConfig.handlers.rm).toEqual([timeDelete, 'args']);
  });
});

describe('time command routing', () => {
  const mockTimeList = vi.fn().mockResolvedValue(undefined);
  const mockTimeGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockTimeAdd = vi.fn().mockResolvedValue(undefined);
  const mockTimeUpdate = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockTimeDelete = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'time',
    handlers: {
      list: mockTimeList,
      ls: mockTimeList,
      get: [mockTimeGet, 'args'],
      add: mockTimeAdd,
      update: [mockTimeUpdate, 'args'],
      delete: [mockTimeDelete, 'args'],
      rm: [mockTimeDelete, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockTimeList.mockClear();
    mockTimeGet.mockClear();
    mockTimeAdd.mockClear();
    mockTimeUpdate.mockClear();
    mockTimeDelete.mockClear();
  });

  it('routes "list" subcommand to timeList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockTimeList).toHaveBeenCalled();
  });

  it('routes "ls" alias to timeList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockTimeList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to timeGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockTimeGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "add" subcommand to timeAdd handler', async () => {
    await router('add', [], { format: 'json' });
    expect(mockTimeAdd).toHaveBeenCalled();
  });

  it('routes "update" subcommand to timeUpdate handler', async () => {
    await router('update', ['123'], { format: 'json' });
    expect(mockTimeUpdate).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "delete" subcommand to timeDelete handler', async () => {
    await router('delete', ['123'], { format: 'json' });
    expect(mockTimeDelete).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "rm" alias to timeDelete handler', async () => {
    await router('rm', ['123'], { format: 'json' });
    expect(mockTimeDelete).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown time subcommand: unknown'),
    );
  });
});
