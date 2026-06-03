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
// The global CLI arg parser strips every `--flag` and misclassifies tokens that
// follow a slash-path, so the `run` command MUST recover the script invocation
// straight from raw argv. extractRunArgs splits the raw argv into the CLI-level
// flags (before the script path) and the script args (the script path plus
// everything after it, forwarded verbatim).

describe('extractRunArgs', () => {
  it('forwards named flags after the script path verbatim (the core bug)', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(
      extractRunArgs(['run', './report.mjs', '--from', '2025-01-01', '--to', '2025-01-31']),
    ).toEqual({
      cliArgs: [],
      scriptArgs: ['./report.mjs', '--from', '2025-01-01', '--to', '2025-01-31'],
    });
  });

  it('forwards positional args after a slash-path without misclassifying them', async () => {
    const { extractRunArgs } = await import('./command.js');

    // Previously the global parser routed `2025-01-01` into `command`, so the
    // script path became `2025-01-01` → ERR_MODULE_NOT_FOUND.
    expect(extractRunArgs(['run', './report.mjs', '2025-01-01', '2025-01-31'])).toEqual({
      cliArgs: [],
      scriptArgs: ['./report.mjs', '2025-01-01', '2025-01-31'],
    });
  });

  it('detects a slash-less script path', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', 'report.mjs', '--mine'])).toEqual({
      cliArgs: [],
      scriptArgs: ['report.mjs', '--mine'],
    });
  });

  it('detects an absolute script path', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '/abs/path/report.ts', '--from', 'x'])).toEqual({
      cliArgs: [],
      scriptArgs: ['/abs/path/report.ts', '--from', 'x'],
    });
  });

  it('keeps a boolean CLI flag before the script in cliArgs', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '--dry-run', './report.mjs', '--from', 'x'])).toEqual({
      cliArgs: ['--dry-run'],
      scriptArgs: ['./report.mjs', '--from', 'x'],
    });
  });

  it('keeps value-taking CLI flags before the script in cliArgs', async () => {
    const { extractRunArgs } = await import('./command.js');

    // The flag value `abc` must NOT be mistaken for the script path.
    expect(extractRunArgs(['run', '--token', 'abc', './report.mjs', '--from', 'x'])).toEqual({
      cliArgs: ['--token', 'abc'],
      scriptArgs: ['./report.mjs', '--from', 'x'],
    });
  });

  it('supports the `script` command alias', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['script', './report.ts'])).toEqual({
      cliArgs: [],
      scriptArgs: ['./report.ts'],
    });
  });

  it('treats a flag after the script path as a forwarded script arg, not a CLI flag', async () => {
    const { extractRunArgs } = await import('./command.js');

    // `--list` after the script path belongs to the script, not to `run`.
    expect(extractRunArgs(['run', './report.mjs', '--list'])).toEqual({
      cliArgs: [],
      scriptArgs: ['./report.mjs', '--list'],
    });
  });

  it('returns no script args for `--list` with no directory', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '--list'])).toEqual({
      cliArgs: ['--list'],
      scriptArgs: [],
    });
  });

  it('keeps `--list <dir>` entirely in cliArgs when dir is not a script file', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '--list', './automation'])).toEqual({
      cliArgs: ['--list', './automation'],
      scriptArgs: [],
    });
  });

  it('returns empty args when only the command is present', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run'])).toEqual({ cliArgs: [], scriptArgs: [] });
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

    expect(extractRunArgs(['run', file, '--flag']).scriptArgs).toEqual([file, '--flag']);
  });

  it('does not treat a .json flag value as the script path', async () => {
    const { extractRunArgs } = await import('./command.js');

    expect(extractRunArgs(['run', '--config', 'app.json', './real.mjs'])).toEqual({
      cliArgs: ['--config', 'app.json'],
      scriptArgs: ['./real.mjs'],
    });
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

  it('calls scriptRun with the script path', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand(['./my-script.ts'], {});

    expect(scriptRun).toHaveBeenCalledWith(['./my-script.ts'], expect.anything());
  });

  it('forwards script args verbatim to scriptRun', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand(['./my-script.ts', '--from', '2025-01-01', '--mine'], {});

    expect(scriptRun).toHaveBeenCalledWith(
      ['./my-script.ts', '--from', '2025-01-01', '--mine'],
      expect.anything(),
    );
  });

  it('re-injects --dry-run ahead of the script args when the CLI flag is set', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand(['./my-script.ts', '--from', 'x'], { 'dry-run': true });

    expect(scriptRun).toHaveBeenCalledWith(
      ['--dry-run', './my-script.ts', '--from', 'x'],
      expect.anything(),
    );
  });

  it('does not re-inject --dry-run when the flag is absent', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand(['./my-script.ts'], {});

    const call = vi.mocked(scriptRun).mock.calls[0][0];
    expect(call).not.toContain('--dry-run');
  });

  it('calls scriptList (no dir) when options.list is true', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptList } = await import('./list.js');
    const { scriptRun } = await import('./handlers.js');

    await handleRunCommand([], { list: true });

    expect(scriptList).toHaveBeenCalledWith(undefined);
    expect(scriptRun).not.toHaveBeenCalled();
  });

  it('passes the directory to scriptList when options.list is a string', async () => {
    const { handleRunCommand } = await import('./command.js');
    const { scriptList } = await import('./list.js');

    await handleRunCommand([], { list: './automation' });

    expect(scriptList).toHaveBeenCalledWith('./automation');
  });
});

// ── End-to-end argv path (the coverage gap called out in the issue) ─────────
//
// Feeds a real argv through extractRunArgs → parseArgs → handleRunCommand and
// asserts that a named flag after the script path reaches scriptRun. The old
// suite only called scriptRun directly with the flags already present, so it
// never exercised the global parser stripping them.

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

  it('forwards `--from x` from a raw argv all the way to scriptRun', async () => {
    const { extractRunArgs, handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    const { cliArgs, scriptArgs } = extractRunArgs(['run', 'report.mjs', '--from', 'x']);
    const options = parseArgs(cliArgs).options;
    await handleRunCommand(scriptArgs, options);

    expect(scriptRun).toHaveBeenCalledWith(['report.mjs', '--from', 'x'], expect.anything());
  });

  it('routes a leading --dry-run to dry-run mode while still forwarding flags', async () => {
    const { extractRunArgs, handleRunCommand } = await import('./command.js');
    const { scriptRun } = await import('./handlers.js');

    const { cliArgs, scriptArgs } = extractRunArgs([
      'run',
      '--dry-run',
      './report.mjs',
      '--from',
      'x',
    ]);
    const options = parseArgs(cliArgs).options;
    await handleRunCommand(scriptArgs, options);

    expect(scriptRun).toHaveBeenCalledWith(
      ['--dry-run', './report.mjs', '--from', 'x'],
      expect.anything(),
    );
  });
});
