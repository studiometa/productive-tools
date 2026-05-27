import { describe, expect, it, vi } from 'vitest';

import { discoverScripts, importScriptMetas, printScriptList } from './list.js';

// ── importScriptMetas ─────────────────────────────────────────────────────────

vi.mock('node:child_process', () => {
  const EventEmitter = require('node:events');

  /**
   * Factory for a fake child process.
   *
   * `stdoutData`  — written to the stdout stream after stdin 'end'.
   * `exitCode`    — emitted with the 'close' event.
   */
  function makeFakeChild(stdoutData: string, exitCode = 0) {
    const stdin = new EventEmitter() as {
      write: ReturnType<typeof vi.fn>;
      end: ReturnType<typeof vi.fn>;
    };
    const stdout = new EventEmitter();

    stdin.write = vi.fn();
    stdin.end = vi.fn().mockImplementation(() => {
      // Simulate async stdout emission then close
      process.nextTick(() => {
        stdout.emit('data', Buffer.from(stdoutData));
        process.nextTick(() => child.emit('close', exitCode));
      });
    });

    const child = Object.assign(new EventEmitter(), { stdin, stdout });
    return child;
  }

  return {
    spawn: vi
      .fn()
      .mockImplementation(() =>
        makeFakeChild(JSON.stringify([{ name: 'Test Script', description: 'A test.' }])),
      ),
    // expose factory so individual tests can override it
    __makeFakeChild: makeFakeChild,
  };
});

describe('importScriptMetas', () => {
  it('returns an empty array for an empty input', async () => {
    expect(await importScriptMetas([])).toEqual([]);
  });

  it('spawns node with --experimental-strip-types and --input-type=module', async () => {
    const { spawn } = await import('node:child_process');
    await importScriptMetas(['/scripts/test.ts']);

    expect(vi.mocked(spawn)).toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining(['--experimental-strip-types', '--input-type=module']),
      expect.objectContaining({ env: expect.objectContaining({ NODE_NO_WARNINGS: '1' }) }),
    );
  });

  it('returns parsed metas from subprocess stdout', async () => {
    const { spawn } = await import('node:child_process');
    const { __makeFakeChild } = (await import('node:child_process')) as never as {
      __makeFakeChild: (data: string) => unknown;
    };

    vi.mocked(spawn).mockReturnValueOnce(
      __makeFakeChild(JSON.stringify([{ name: 'My Script' }, {}])) as never,
    );

    const result = await importScriptMetas(['/a.ts', '/b.ts']);
    expect(result).toEqual([{ name: 'My Script' }, {}]);
  });

  it('returns empty metas when subprocess output is invalid JSON', async () => {
    const { spawn } = await import('node:child_process');
    const { __makeFakeChild } = (await import('node:child_process')) as never as {
      __makeFakeChild: (data: string) => unknown;
    };

    vi.mocked(spawn).mockReturnValueOnce(__makeFakeChild('not-json') as never);

    const result = await importScriptMetas(['/a.ts', '/b.ts']);
    expect(result).toEqual([{}, {}]);
  });

  it('returns empty metas when parsed array length mismatches input', async () => {
    const { spawn } = await import('node:child_process');
    const { __makeFakeChild } = (await import('node:child_process')) as never as {
      __makeFakeChild: (data: string) => unknown;
    };

    vi.mocked(spawn).mockReturnValueOnce(__makeFakeChild(JSON.stringify([{}])) as never);

    // 2 paths but only 1 meta → fallback to all-empty
    const result = await importScriptMetas(['/a.ts', '/b.ts']);
    expect(result).toEqual([{}, {}]);
  });
});

// ── discoverScripts ───────────────────────────────────────────────────────────

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
}));

describe('discoverScripts', () => {
  it('returns an empty array when the directory does not exist', async () => {
    const { readdir } = await import('node:fs/promises');
    vi.mocked(readdir).mockRejectedValue(new Error('ENOENT'));

    const result = await discoverScripts('/nonexistent');
    expect(result).toEqual([]);
  });

  it('skips non-script files (e.g. README.md)', async () => {
    const { readdir } = await import('node:fs/promises');
    vi.mocked(readdir).mockResolvedValue(['README.md', 'package.json'] as never);

    const result = await discoverScripts('/scripts');
    expect(result).toHaveLength(0);
  });

  it('discovers .ts, .mts, .js, .mjs files', async () => {
    const { readdir } = await import('node:fs/promises');
    const { spawn } = await import('node:child_process');
    const { __makeFakeChild } = (await import('node:child_process')) as never as {
      __makeFakeChild: (data: string) => unknown;
    };
    vi.mocked(readdir).mockResolvedValue(['a.ts', 'b.mts', 'c.js', 'd.mjs', 'e.txt'] as never);
    vi.mocked(spawn).mockReturnValueOnce(
      __makeFakeChild(JSON.stringify([{}, {}, {}, {}])) as never,
    );

    const result = await discoverScripts('/scripts');
    expect(result).toHaveLength(4);
    expect(result.map((s) => s.path)).toEqual([
      '/scripts/a.ts',
      '/scripts/b.mts',
      '/scripts/c.js',
      '/scripts/d.mjs',
    ]);
  });

  it('merges imported meta into discovered scripts', async () => {
    const { readdir } = await import('node:fs/promises');
    const { spawn } = await import('node:child_process');
    const { __makeFakeChild } = (await import('node:child_process')) as never as {
      __makeFakeChild: (data: string) => unknown;
    };
    vi.mocked(readdir).mockResolvedValue(['report.ts'] as never);
    vi.mocked(spawn).mockReturnValueOnce(
      __makeFakeChild(JSON.stringify([{ name: 'Report', description: 'Weekly report' }])) as never,
    );

    const result = await discoverScripts('/scripts');
    expect(result[0].meta).toEqual({ name: 'Report', description: 'Weekly report' });
  });

  it('returns empty meta for scripts where import yields no meta', async () => {
    const { readdir } = await import('node:fs/promises');
    const { spawn } = await import('node:child_process');
    const { __makeFakeChild } = (await import('node:child_process')) as never as {
      __makeFakeChild: (data: string) => unknown;
    };
    vi.mocked(readdir).mockResolvedValue(['plain.ts'] as never);
    vi.mocked(spawn).mockReturnValueOnce(__makeFakeChild(JSON.stringify([{}])) as never);

    const result = await discoverScripts('/scripts');
    expect(result[0].meta).toEqual({});
  });
});

// ── printScriptList ───────────────────────────────────────────────────────────

describe('printScriptList', () => {
  it('prints a no-scripts message when the list is empty', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printScriptList([], '/scripts');
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('No scripts found');
    logSpy.mockRestore();
  });

  it('prints a header with count and each script', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printScriptList(
      [
        {
          path: '/scripts/report.ts',
          relativePath: 'scripts/report.ts',
          meta: { name: 'Weekly Report', description: 'Generates a report' },
        },
      ],
      '/scripts',
    );
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('1 found');
    expect(output).toContain('Weekly Report');
    expect(output).toContain('scripts/report.ts');
    expect(output).toContain('Generates a report');
    logSpy.mockRestore();
  });

  it('prints usage with meta.usage when available', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printScriptList(
      [
        {
          path: '/scripts/export.ts',
          relativePath: 'scripts/export.ts',
          meta: { usage: '--from <date> --to <date>' },
        },
      ],
      '/scripts',
    );
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('--from <date> --to <date>');
    logSpy.mockRestore();
  });
});
