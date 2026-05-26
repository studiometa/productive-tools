import type { ChildProcess } from 'node:child_process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CommandContext } from '../../context.js';

import { isTypeScriptFile, waitForProcess } from './handlers.js';

// ── isTypeScriptFile ────────────────────────────────────────────────────────

describe('isTypeScriptFile', () => {
  it('returns true for .ts files', () => {
    expect(isTypeScriptFile('/path/to/script.ts')).toBe(true);
  });

  it('returns true for .mts files', () => {
    expect(isTypeScriptFile('/path/to/script.mts')).toBe(true);
  });

  it('returns false for .js files', () => {
    expect(isTypeScriptFile('/path/to/script.js')).toBe(false);
  });

  it('returns false for .mjs files', () => {
    expect(isTypeScriptFile('/path/to/script.mjs')).toBe(false);
  });

  it('returns false for files with no extension', () => {
    expect(isTypeScriptFile('/path/to/script')).toBe(false);
  });
});

// ── waitForProcess ────────────────────────────────────────────────────────

describe('waitForProcess', () => {
  it('resolves with the child process exit code', async () => {
    const emitter = {
      on: vi.fn((event: string, cb: (code: number | null) => void) => {
        if (event === 'close') {
          setTimeout(() => cb(0), 0);
        }
      }),
    };
    const code = await waitForProcess(emitter as unknown as ChildProcess);
    expect(code).toBe(0);
  });

  it('defaults to exit code 1 when code is null', async () => {
    const emitter = {
      on: vi.fn((event: string, cb: (code: number | null) => void) => {
        if (event === 'close') {
          setTimeout(() => cb(null), 0);
        }
      }),
    };
    const code = await waitForProcess(emitter as unknown as ChildProcess);
    expect(code).toBe(1);
  });

  it('resolves with non-zero exit code', async () => {
    const emitter = {
      on: vi.fn((event: string, cb: (code: number | null) => void) => {
        if (event === 'close') {
          setTimeout(() => cb(42), 0);
        }
      }),
    };
    const code = await waitForProcess(emitter as unknown as ChildProcess);
    expect(code).toBe(42);
  });
});

// ── scriptRun ────────────────────────────────────────────────────────────

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  mkdtemp: vi.fn().mockResolvedValue('/tmp/productive-script-abc'),
  writeFile: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:os', () => ({
  tmpdir: vi.fn().mockReturnValue('/tmp'),
}));

/**
 * Build a minimal CommandContext for these tests — only config + formatter
 * are needed by scriptRun, so we avoid the full createTestContext machinery.
 */
function makeCtx(config?: Partial<CommandContext['config']>): CommandContext {
  const defaultConfig: CommandContext['config'] = {
    apiToken: 'test-token',
    organizationId: 'test-org',
    userId: 'test-user',
    baseUrl: 'https://api.productive.io/api/v2',
    ...config,
  };

  const formatter = {
    error: vi.fn(),
    output: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  };

  return {
    config: defaultConfig,
    formatter: formatter as unknown as CommandContext['formatter'],
    api: {} as CommandContext['api'],
    cache: {} as CommandContext['cache'],
    options: {},
    createSpinner: vi.fn(),
    getPagination: vi.fn().mockReturnValue({ page: 1, perPage: 100 }),
    getSort: vi.fn().mockReturnValue(''),
    resolveFilters: vi.fn(),
    tryResolveValue: vi.fn(),
  } as unknown as CommandContext;
}

describe('scriptRun', () => {
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks(); // reset mock call counts between tests
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits with code 1 when no script path is provided', async () => {
    const { scriptRun } = await import('./handlers.js');
    const ctx = makeCtx();

    await scriptRun([], ctx);

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('always includes --enable-source-maps for accurate stack traces', async () => {
    const { spawn } = await import('node:child_process');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx();
    const mockResolver = vi
      .fn()
      .mockResolvedValue('file:///node_modules/@studiometa/productive-sdk/dist/index.js');

    // Both .ts and .js files should get --enable-source-maps
    await scriptRun(['/tmp/test-script.js'], ctx, mockResolver);
    expect(vi.mocked(spawn).mock.calls[0][1]).toContain('--enable-source-maps');
  });

  it('spawns node with TS flags for .ts files', async () => {
    const { spawn } = await import('node:child_process');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx();
    const mockResolver = vi
      .fn()
      .mockResolvedValue('file:///node_modules/@studiometa/productive-sdk/dist/index.js');

    await scriptRun(['/tmp/test-script.ts'], ctx, mockResolver);

    const spawnArgs = vi.mocked(spawn).mock.calls[0];
    expect(spawnArgs[1]).toContain('--enable-source-maps');
    expect(spawnArgs[1]).toContain('--experimental-strip-types');
    expect(spawnArgs[1]).toContain('--experimental-transform-types');
  });

  it('spawns node WITHOUT TS flags for .js files', async () => {
    const { spawn } = await import('node:child_process');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx();
    const mockResolver = vi
      .fn()
      .mockResolvedValue('file:///node_modules/@studiometa/productive-sdk/dist/index.js');

    await scriptRun(['/tmp/test-script.js'], ctx, mockResolver);

    const spawnArgs = vi.mocked(spawn).mock.calls[0];
    expect(spawnArgs[1]).not.toContain('--experimental-strip-types');
    expect(spawnArgs[1]).toContain('--enable-source-maps'); // always present
  });

  it('passes PRODUCTIVE_* env vars to the subprocess', async () => {
    const { spawn } = await import('node:child_process');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx({
      apiToken: 'my-token',
      organizationId: 'my-org',
      userId: 'my-user',
      baseUrl: 'https://custom.example.com',
    });

    const mockResolver = vi.fn().mockResolvedValue('file:///sdk/dist/index.js');
    await scriptRun(['/tmp/test-script.js'], ctx, mockResolver);

    const spawnOptions = vi.mocked(spawn).mock.calls[0][2] as { env: Record<string, string> };
    expect(spawnOptions.env.PRODUCTIVE_API_TOKEN).toBe('my-token');
    expect(spawnOptions.env.PRODUCTIVE_ORG_ID).toBe('my-org');
    expect(spawnOptions.env.PRODUCTIVE_USER_ID).toBe('my-user');
    expect(spawnOptions.env.PRODUCTIVE_BASE_URL).toBe('https://custom.example.com');
  });

  it('forwards the subprocess exit code', async () => {
    const { spawn } = await import('node:child_process');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(42);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx();
    const mockResolver = vi.fn().mockResolvedValue('file:///sdk/dist/index.js');

    await scriptRun(['/tmp/test-script.js'], ctx, mockResolver);

    expect(processExitSpy).toHaveBeenCalledWith(42);
  });

  it('writes a wrapper .mjs to the temp directory', async () => {
    const { spawn } = await import('node:child_process');
    const { writeFile } = await import('node:fs/promises');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx();
    const mockResolver = vi.fn().mockResolvedValue('file:///sdk/dist/index.js');

    await scriptRun(['/tmp/test-script.js'], ctx, mockResolver);

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('wrapper.mjs'),
      expect.stringContaining('Auto-generated by `productive run`'),
      'utf-8',
    );
  });

  it('cleans up the temp directory after execution', async () => {
    const { spawn } = await import('node:child_process');
    const { rm } = await import('node:fs/promises');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx();
    const mockResolver = vi.fn().mockResolvedValue('file:///sdk/dist/index.js');

    await scriptRun(['/tmp/test-script.js'], ctx, mockResolver);

    expect(rm).toHaveBeenCalledWith(
      expect.stringContaining('productive-script'),
      expect.objectContaining({ recursive: true, force: true }),
    );
  });

  it('strips --dry-run from script args and sets PRODUCTIVE_DRY_RUN=1', async () => {
    const { spawn } = await import('node:child_process');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx();
    const mockResolver = vi.fn().mockResolvedValue('file:///sdk/dist/index.js');

    await scriptRun(
      ['--dry-run', '/tmp/test-script.js', '--from', '2025-01-01'],
      ctx,
      mockResolver,
    );

    const spawnArgs = vi.mocked(spawn).mock.calls[0];
    // --dry-run must NOT be passed to the subprocess as a script arg
    expect(spawnArgs[1]).not.toContain('--dry-run');
    // PRODUCTIVE_DRY_RUN must be set in env
    const spawnOptions = spawnArgs[2] as { env: Record<string, string> };
    expect(spawnOptions.env.PRODUCTIVE_DRY_RUN).toBe('1');
    // Script path must still be the wrapper, not the --dry-run value
    const nodeArgs = spawnArgs[1] as string[];
    expect(nodeArgs.some((a) => a.endsWith('wrapper.mjs'))).toBe(true);
  });

  it('does not set PRODUCTIVE_DRY_RUN when --dry-run is absent', async () => {
    const { spawn } = await import('node:child_process');
    const { scriptRun } = await import('./handlers.js');

    const mockChild = {
      on: vi.fn((event: string, cb: (code: number) => void) => {
        if (event === 'close') cb(0);
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as never);

    const ctx = makeCtx();
    const mockResolver = vi.fn().mockResolvedValue('file:///sdk/dist/index.js');

    await scriptRun(['/tmp/test-script.js'], ctx, mockResolver);

    const spawnOptions = vi.mocked(spawn).mock.calls[0][2] as { env: Record<string, string> };
    expect(spawnOptions.env.PRODUCTIVE_DRY_RUN).toBeUndefined();
  });
});
