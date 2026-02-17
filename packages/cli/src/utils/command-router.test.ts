import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createCommandRouter, type ListHandler, type ArgsHandler } from './command-router.js';

// Mock the context module to avoid API token requirement
vi.mock('../context.js', () => ({
  createContext: vi.fn((options) => ({
    api: {},
    formatter: { output: vi.fn(), error: vi.fn() },
    config: { apiToken: 'test-token', organizationId: '12345' },
    cache: {},
    options,
    createSpinner: vi.fn(() => ({ start: vi.fn(), succeed: vi.fn(), fail: vi.fn() })),
    getPagination: () => ({ page: 1, perPage: 100 }),
    getSort: () => '',
    resolveFilters: vi.fn(),
    tryResolveValue: vi.fn(),
  })),
}));

// Mock process.exit to prevent test from actually exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// Mock console.error to capture error output
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('createCommandRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('routes to correct handler for list-style commands', async () => {
    const listHandler = vi.fn<ListHandler>().mockResolvedValue(undefined);

    const router = createCommandRouter({
      resource: 'tasks',
      handlers: {
        list: listHandler,
      },
    });

    await router('list', [], { format: 'json' });

    expect(listHandler).toHaveBeenCalledTimes(1);
    expect(listHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ format: 'json' }),
      }),
    );
  });

  it('handles aliases correctly', async () => {
    const listHandler = vi.fn<ListHandler>().mockResolvedValue(undefined);

    const router = createCommandRouter({
      resource: 'tasks',
      handlers: {
        list: listHandler,
        ls: listHandler, // alias
      },
    });

    await router('ls', [], { format: 'json' });

    expect(listHandler).toHaveBeenCalledTimes(1);
  });

  it('passes args to args-style handlers', async () => {
    const getHandler = vi.fn<ArgsHandler>().mockResolvedValue(undefined);

    const router = createCommandRouter({
      resource: 'tasks',
      handlers: {
        get: [getHandler, 'args'],
      },
    });

    await router('get', ['123', '456'], { format: 'json' });

    expect(getHandler).toHaveBeenCalledTimes(1);
    expect(getHandler).toHaveBeenCalledWith(
      ['123', '456'],
      expect.objectContaining({
        options: expect.objectContaining({ format: 'json' }),
      }),
    );
  });

  it('exits with error for unknown subcommand', async () => {
    const router = createCommandRouter({
      resource: 'tasks',
      handlers: {
        list: vi.fn().mockResolvedValue(undefined),
      },
    });

    await router('unknown', [], { format: 'human' });

    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Unknown tasks subcommand: unknown'),
    );
  });

  it('uses resource name in error message', async () => {
    const router = createCommandRouter({
      resource: 'projects',
      handlers: {},
    });

    await router('invalid', [], { format: 'human' });

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Unknown projects subcommand: invalid'),
    );
  });

  it('passes format option to context', async () => {
    const listHandler = vi.fn<ListHandler>().mockResolvedValue(undefined);

    const router = createCommandRouter({
      resource: 'tasks',
      handlers: {
        list: listHandler,
      },
    });

    await router('list', [], { format: 'table', 'no-color': true });

    expect(listHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          format: 'table',
          'no-color': true,
        }),
      }),
    );
  });

  it('supports short format option (f)', async () => {
    const listHandler = vi.fn<ListHandler>().mockResolvedValue(undefined);

    const router = createCommandRouter({
      resource: 'tasks',
      handlers: {
        list: listHandler,
      },
    });

    await router('list', [], { f: 'csv' });

    expect(listHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ f: 'csv' }),
      }),
    );
  });

  it('handles multiple handlers in config', async () => {
    const listHandler = vi.fn<ListHandler>().mockResolvedValue(undefined);
    const getHandler = vi.fn<ArgsHandler>().mockResolvedValue(undefined);
    const addHandler = vi.fn<ListHandler>().mockResolvedValue(undefined);
    const updateHandler = vi.fn<ArgsHandler>().mockResolvedValue(undefined);

    const router = createCommandRouter({
      resource: 'tasks',
      handlers: {
        list: listHandler,
        ls: listHandler,
        get: [getHandler, 'args'],
        add: addHandler,
        create: addHandler,
        update: [updateHandler, 'args'],
      },
    });

    // Test each handler type
    await router('list', [], { format: 'json' });
    expect(listHandler).toHaveBeenCalledTimes(1);

    await router('get', ['123'], { format: 'json' });
    expect(getHandler).toHaveBeenCalledTimes(1);
    expect(getHandler).toHaveBeenCalledWith(['123'], expect.anything());

    await router('add', [], { format: 'json' });
    expect(addHandler).toHaveBeenCalledTimes(1);

    await router('update', ['456'], { format: 'json' });
    expect(updateHandler).toHaveBeenCalledTimes(1);
    expect(updateHandler).toHaveBeenCalledWith(['456'], expect.anything());
  });
});
