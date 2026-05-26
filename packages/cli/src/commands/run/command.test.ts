import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the handler to avoid spawning real processes
vi.mock('./handlers.js', () => ({
  scriptRun: vi.fn().mockResolvedValue(undefined),
}));

// Mock config to avoid file system access
vi.mock('../../config.js', () => ({
  getConfig: vi.fn().mockReturnValue({
    apiToken: 'test-token',
    organizationId: 'test-org',
    baseUrl: 'https://api.productive.io/api/v2',
  }),
}));

// Mock cache with constructable CacheStore
vi.mock('../../utils/cache.js', () => {
  const mockCacheObj = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    setOrgId: vi.fn(),
    getCachedPeople: vi.fn(),
    getCachedProjects: vi.fn(),
    getCachedTaskLists: vi.fn(),
    findCachedPersonByEmail: vi.fn(),
    findCachedProjectByNumber: vi.fn(),
    findCachedTaskListByName: vi.fn(),
  };
  return {
    getCache: vi.fn().mockReturnValue(mockCacheObj),
    CacheStore: vi.fn().mockImplementation(() => mockCacheObj),
  };
});

describe('handleRunCommand', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('calls scriptRun with the subcommand as first arg', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand('./my-script.ts', [], { format: 'human' });

    expect(scriptRun).toHaveBeenCalledWith(['./my-script.ts'], expect.anything());
  });

  it('merges subcommand and positional into allArgs', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand('./my-script.ts', ['--flag', 'value'], { format: 'human' });

    expect(scriptRun).toHaveBeenCalledWith(
      ['./my-script.ts', '--flag', 'value'],
      expect.anything(),
    );
  });

  it('handles undefined subcommand (positional only)', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand(undefined, ['./my-script.js', 'arg1'], { format: 'human' });

    expect(scriptRun).toHaveBeenCalledWith(['./my-script.js', 'arg1'], expect.anything());
  });
});
