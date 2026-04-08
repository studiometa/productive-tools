import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { dealsCommandConfig } from './command.js';
import { dealsList, dealsGet, dealsAdd, dealsUpdate } from './handlers.js';

describe('deals command wiring', () => {
  it('uses "deals" as resource name', () => {
    expect(dealsCommandConfig.resource).toBe('deals');
  });

  it('wires list and ls to dealsList', () => {
    expect(dealsCommandConfig.handlers.list).toBe(dealsList);
    expect(dealsCommandConfig.handlers.ls).toBe(dealsList);
  });

  it('wires get to dealsGet as args handler', () => {
    expect(dealsCommandConfig.handlers.get).toEqual([dealsGet, 'args']);
  });

  it('wires add and create to dealsAdd', () => {
    expect(dealsCommandConfig.handlers.add).toBe(dealsAdd);
    expect(dealsCommandConfig.handlers.create).toBe(dealsAdd);
  });

  it('wires update to dealsUpdate as args handler', () => {
    expect(dealsCommandConfig.handlers.update).toEqual([dealsUpdate, 'args']);
  });
});

describe('deals command routing', () => {
  const mockDealsList = vi.fn().mockResolvedValue(undefined);
  const mockDealsGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockDealsAdd = vi.fn().mockResolvedValue(undefined);
  const mockDealsUpdate = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'deals',
    handlers: {
      list: mockDealsList,
      ls: mockDealsList,
      get: [mockDealsGet, 'args'],
      add: mockDealsAdd,
      create: mockDealsAdd,
      update: [mockDealsUpdate, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockDealsList.mockClear();
    mockDealsGet.mockClear();
    mockDealsAdd.mockClear();
    mockDealsUpdate.mockClear();
  });

  it('routes "list" subcommand to dealsList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockDealsList).toHaveBeenCalled();
  });

  it('routes "ls" alias to dealsList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockDealsList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to dealsGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockDealsGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "add" subcommand to dealsAdd handler', async () => {
    await router('add', [], { format: 'json' });
    expect(mockDealsAdd).toHaveBeenCalled();
  });

  it('routes "create" alias to dealsAdd handler', async () => {
    await router('create', [], { format: 'json' });
    expect(mockDealsAdd).toHaveBeenCalled();
  });

  it('routes "update" subcommand to dealsUpdate handler', async () => {
    await router('update', ['123'], { format: 'json' });
    expect(mockDealsUpdate).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown deals subcommand: unknown'),
    );
  });
});
