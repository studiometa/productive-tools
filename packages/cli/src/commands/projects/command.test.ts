import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { projectsCommandConfig } from './command.js';
import { projectsList, projectsGet } from './handlers.js';

describe('projects command wiring', () => {
  it('uses "projects" as resource name', () => {
    expect(projectsCommandConfig.resource).toBe('projects');
  });

  it('wires list and ls to projectsList', () => {
    expect(projectsCommandConfig.handlers.list).toBe(projectsList);
    expect(projectsCommandConfig.handlers.ls).toBe(projectsList);
  });

  it('wires get to projectsGet as args handler', () => {
    expect(projectsCommandConfig.handlers.get).toEqual([projectsGet, 'args']);
  });
});

describe('projects command routing', () => {
  const mockList = vi.fn().mockResolvedValue(undefined);
  const mockGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'projects',
    handlers: {
      list: mockList,
      ls: mockList,
      get: [mockGet, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockList.mockClear();
    mockGet.mockClear();
  });

  it('routes "list" subcommand to list handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockList).toHaveBeenCalled();
  });

  it('routes "ls" alias to list handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to get handler with args', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown projects subcommand: unknown'),
    );
  });
});
