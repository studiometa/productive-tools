import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseArgs } from '../../utils/args.js';

// Mock the handler to avoid spawning real processes
vi.mock('./handlers.js', () => ({
  scriptRun: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./list.js', () => ({
  scriptList: vi.fn().mockResolvedValue(undefined),
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

// ── extractRunArgs ──────────────────────────────────────────────────────────
//
// The `--` separator divides run-options (left) from script args (right). The
// script path is the first JS/TS file token before `--`. Everything after `--`
// is forwarded to the script verbatim — the global parser never sees it.

describe('extractRunArgs', () => {
  it('forwards named flags placed after the -- separator', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(
      extractRunArgs(['run', './report.mjs', '--', '--from', '2025-01-01', '--to', '2025-01-31']),
    ).toEqual({
      cliArgs: ['./report.mjs'],
      scriptPath: './report.mjs',
      scriptArgs: ['--from', '2025-01-01', '--to', '2025-01-31'],
    });
  });

  it('forwards positional args placed after the -- separator', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', './report.mjs', '--', '2025-01-01', '2025-01-31'])).toEqual({
      cliArgs: ['./report.mjs'],
      scriptPath: './report.mjs',
      scriptArgs: ['2025-01-01', '2025-01-31'],
    });
  });

  it('keeps run-options that follow the script path on the left of --', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(
      extractRunArgs(['run', './report.mjs', '--token', 'abc', '--org-id', '42', '--', '--mine']),
    ).toEqual({
      cliArgs: ['./report.mjs', '--token', 'abc', '--org-id', '42'],
      scriptPath: './report.mjs',
      scriptArgs: ['--mine'],
    });
  });

  it('detects the script path even when run-options precede it', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '--dry-run', './report.mjs', '--', '--from', 'x'])).toEqual({
      cliArgs: ['--dry-run', './report.mjs'],
      scriptPath: './report.mjs',
      scriptArgs: ['--from', 'x'],
    });
  });

  it('treats flags as run-options (not forwarded) when there is no -- separator', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', './report.mjs', '--from', 'x'])).toEqual({
      cliArgs: ['./report.mjs', '--from', 'x'],
      scriptPath: './report.mjs',
      scriptArgs: [],
    });
  });

  it('only splits on the first --, preserving any further -- in script args', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', './report.mjs', '--', '--from', '--', 'x']).scriptArgs).toEqual([
      '--from',
      '--',
      'x',
    ]);
  });

  it('detects a slash-less script path', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', 'report.mjs', '--', '--mine'])).toEqual({
      cliArgs: ['report.mjs'],
      scriptPath: 'report.mjs',
      scriptArgs: ['--mine'],
    });
  });

  it('detects an absolute script path', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '/abs/path/report.ts', '--', '--from', 'x'])).toEqual({
      cliArgs: ['/abs/path/report.ts'],
      scriptPath: '/abs/path/report.ts',
      scriptArgs: ['--from', 'x'],
    });
  });

  it('supports the `script` command alias', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['script', './report.ts'])).toEqual({
      cliArgs: ['./report.ts'],
      scriptPath: './report.ts',
      scriptArgs: [],
    });
  });

  it('returns no script path or args for `--list` with no directory', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '--list'])).toEqual({
      cliArgs: ['--list'],
      scriptPath: undefined,
      scriptArgs: [],
    });
  });

  it('keeps `--list <dir>` in cliArgs when dir is not a script file', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '--list', './automation'])).toEqual({
      cliArgs: ['--list', './automation'],
      scriptPath: undefined,
      scriptArgs: [],
    });
  });

  it('returns empty args when only the command is present', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run'])).toEqual({
      cliArgs: [],
      scriptPath: undefined,
      scriptArgs: [],
    });
  });

  it('returns empty script args for a trailing -- with nothing after it', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', './report.mjs', '--'])).toEqual({
      cliArgs: ['./report.mjs'],
      scriptPath: './report.mjs',
      scriptArgs: [],
    });
  });

  it.each([
    'script.ts',
    'script.mts',
    'script.cts',
    'script.tsx',
    'script.js',
    'script.mjs',
    'script.cjs',
    'script.jsx',
    'SCRIPT.MJS',
  ])('recognizes %s as a runnable script file', async (file) => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', file]).scriptPath).toBe(file);
  });

  it('does not treat a .json run-option value as the script path', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '--config', 'app.json', './real.mjs']).scriptPath).toBe(
      './real.mjs',
    );
  });
});

// ── handleRunCommand ──────────────────────────────────────────────────────

describe('handleRunCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('calls scriptRun with the script path and no dry-run by default', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand('./my-script.ts', [], {});

    expect(scriptRun).toHaveBeenCalledWith(['./my-script.ts'], expect.anything(), {
      dryRun: false,
    });
  });

  it('forwards script args verbatim to scriptRun', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand('./my-script.ts', ['--from', '2025-01-01', '--mine'], {});

    expect(scriptRun).toHaveBeenCalledWith(
      ['./my-script.ts', '--from', '2025-01-01', '--mine'],
      expect.anything(),
      { dryRun: false },
    );
  });

  it('passes dryRun: true when the --dry-run run-option is set', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand('./my-script.ts', ['--from', 'x'], { 'dry-run': true });

    expect(scriptRun).toHaveBeenCalledWith(['./my-script.ts', '--from', 'x'], expect.anything(), {
      dryRun: true,
    });
  });

  it('calls scriptRun with empty args when no script path was found', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand(undefined, [], {});

    expect(scriptRun).toHaveBeenCalledWith([], expect.anything(), { dryRun: false });
  });

  it('calls scriptList (no dir) when options.list is true, without running', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptList } = await import('./list.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand(undefined, [], { list: true });

    expect(scriptList).toHaveBeenCalledWith(undefined);
    expect(scriptRun).not.toHaveBeenCalled();
  });

  it('passes the directory to scriptList when options.list is a string', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptList } = await import('./list.js');

    await handleRunCommand(undefined, [], { list: './automation' });

    expect(scriptList).toHaveBeenCalledWith('./automation');
  });
});

// ── End-to-end argv path (the coverage gap called out in the issue) ─────────
//
// Feeds a real argv through extractRunArgs → parseArgs → handleRunCommand and
// asserts that a named flag after `--` reaches scriptRun. The old suite only
// called scriptRun directly with the flags already present, so it never
// exercised the global parser.

describe('run command: argv → handleRunCommand forwarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('forwards `--from x` after -- from a raw argv all the way to scriptRun', async () => {
    const { extractRunArgs, handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    const { scriptPath, scriptArgs, cliArgs } = extractRunArgs([
      'run',
      'report.mjs',
      '--',
      '--from',
      'x',
    ]);
    await handleRunCommand(scriptPath, scriptArgs, parseArgs(cliArgs).options);

    expect(scriptRun).toHaveBeenCalledWith(['report.mjs', '--from', 'x'], expect.anything(), {
      dryRun: false,
    });
  });

  it('routes a leading --dry-run to dry-run mode while still forwarding script flags', async () => {
    const { extractRunArgs, handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    const { scriptPath, scriptArgs, cliArgs } = extractRunArgs([
      'run',
      '--dry-run',
      './report.mjs',
      '--',
      '--from',
      'x',
    ]);
    await handleRunCommand(scriptPath, scriptArgs, parseArgs(cliArgs).options);

    expect(scriptRun).toHaveBeenCalledWith(['./report.mjs', '--from', 'x'], expect.anything(), {
      dryRun: true,
    });
  });
});
