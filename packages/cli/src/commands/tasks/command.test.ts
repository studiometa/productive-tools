import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { tasksCommandConfig } from './command.js';
import { tasksList, tasksGet, tasksAdd, tasksUpdate } from './handlers.js';

describe('tasks command wiring', () => {
  it('uses "tasks" as resource name', () => {
    expect(tasksCommandConfig.resource).toBe('tasks');
  });

  it('wires list and ls to tasksList', () => {
    expect(tasksCommandConfig.handlers.list).toBe(tasksList);
    expect(tasksCommandConfig.handlers.ls).toBe(tasksList);
  });

  it('wires get to tasksGet as args handler', () => {
    expect(tasksCommandConfig.handlers.get).toEqual([tasksGet, 'args']);
  });

  it('wires add and create to tasksAdd', () => {
    expect(tasksCommandConfig.handlers.add).toBe(tasksAdd);
    expect(tasksCommandConfig.handlers.create).toBe(tasksAdd);
  });

  it('wires update to tasksUpdate as args handler', () => {
    expect(tasksCommandConfig.handlers.update).toEqual([tasksUpdate, 'args']);
  });
});

describe('tasks command routing', () => {
  const mockTasksList = vi.fn().mockResolvedValue(undefined);
  const mockTasksGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);
  const mockTasksAdd = vi.fn().mockResolvedValue(undefined);
  const mockTasksUpdate = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'tasks',
    handlers: {
      list: mockTasksList,
      ls: mockTasksList,
      get: [mockTasksGet, 'args'],
      add: mockTasksAdd,
      create: mockTasksAdd,
      update: [mockTasksUpdate, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockTasksList.mockClear();
    mockTasksGet.mockClear();
    mockTasksAdd.mockClear();
    mockTasksUpdate.mockClear();
  });

  it('routes "list" subcommand to tasksList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockTasksList).toHaveBeenCalled();
  });

  it('routes "ls" alias to tasksList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockTasksList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to tasksGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockTasksGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('routes "add" subcommand to tasksAdd handler', async () => {
    await router('add', [], { format: 'json' });
    expect(mockTasksAdd).toHaveBeenCalled();
  });

  it('routes "create" alias to tasksAdd handler', async () => {
    await router('create', [], { format: 'json' });
    expect(mockTasksAdd).toHaveBeenCalled();
  });

  it('routes "update" subcommand to tasksUpdate handler', async () => {
    await router('update', ['123'], { format: 'json' });
    expect(mockTasksUpdate).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown tasks subcommand: unknown'),
    );
  });
});
