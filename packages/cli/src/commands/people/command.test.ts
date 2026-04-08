import { describe, it, expect, vi, afterEach } from 'vitest';

import { createTestContext } from '../../context.js';
import { createCommandRouter } from '../../utils/command-router.js';
import { peopleCommandConfig } from './command.js';
import { peopleList, peopleGet } from './handlers.js';

describe('people command wiring', () => {
  it('uses "people" as resource name', () => {
    expect(peopleCommandConfig.resource).toBe('people');
  });

  it('wires list and ls to peopleList', () => {
    expect(peopleCommandConfig.handlers.list).toBe(peopleList);
    expect(peopleCommandConfig.handlers.ls).toBe(peopleList);
  });

  it('wires get to peopleGet as args handler', () => {
    expect(peopleCommandConfig.handlers.get).toEqual([peopleGet, 'args']);
  });
});

describe('people command routing', () => {
  const mockPeopleList = vi.fn().mockResolvedValue(undefined);
  const mockPeopleGet = vi.fn<(args: string[], ctx: unknown) => Promise<void>>().mockResolvedValue(undefined);

  const router = createCommandRouter({
    resource: 'people',
    handlers: {
      list: mockPeopleList,
      ls: mockPeopleList,
      get: [mockPeopleGet, 'args'],
    },
    contextFactory: (options) => createTestContext({ options }),
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockPeopleList.mockClear();
    mockPeopleGet.mockClear();
  });

  it('routes "list" subcommand to peopleList handler', async () => {
    await router('list', [], { format: 'json' });
    expect(mockPeopleList).toHaveBeenCalled();
  });

  it('routes "ls" alias to peopleList handler', async () => {
    await router('ls', [], { format: 'json' });
    expect(mockPeopleList).toHaveBeenCalled();
  });

  it('routes "get" subcommand to peopleGet handler', async () => {
    await router('get', ['123'], { format: 'json' });
    expect(mockPeopleGet).toHaveBeenCalledWith(['123'], expect.anything());
  });

  it('exits with error for unknown subcommand', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await router('unknown', [], { format: 'json' });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown people subcommand: unknown'),
    );
  });
});
