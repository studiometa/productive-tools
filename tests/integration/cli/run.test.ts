/**
 * CLI integration tests — `productive run` argument forwarding
 *
 * Exercises the real CLI binary end-to-end: spawns `productive run <script>`
 * with assorted argument shapes and asserts that the script actually receives
 * the forwarded positional args and named flags.
 *
 * This is the coverage the issue (#176) called out as missing — the previous
 * unit test called the handler directly with flags already present, so it never
 * exercised the path where the global arg parser strips them before `run` runs.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { createCliRunner, type CliRunner } from '../helpers/cli-runner.js';
import { startMockServer, type MockServer } from '../helpers/mock-server.js';

/**
 * A pattern-B script that echoes the forwarded args/flags as JSON on a marked
 * line. It makes no API calls, so the mock server is never hit.
 */
const ECHO_SCRIPT = `export const meta = { name: 'Echo' };
console.log('FORWARDED:' + JSON.stringify({ args: globalThis.args, flags: globalThis.flags }));
`;

/** Parse the `FORWARDED:{...}` line out of the script's stdout. */
function parseForwarded(stdout: string): { args: string[]; flags: Record<string, unknown> } {
  const line = stdout.split('\n').find((l) => l.startsWith('FORWARDED:'));
  if (!line) {
    throw new Error(`No FORWARDED line in output:\n${stdout}`);
  }
  return JSON.parse(line.slice('FORWARDED:'.length));
}

describe('CLI: run argument forwarding', () => {
  let mockServer: MockServer;
  let cli: CliRunner;
  let scriptPath: string;

  beforeAll(async () => {
    mockServer = await startMockServer();
    cli = await createCliRunner(mockServer.apiUrl);
    scriptPath = join(cli.sandbox.dir, 'echo.mjs');
    await writeFile(scriptPath, ECHO_SCRIPT);
  });

  afterAll(async () => {
    await cli.sandbox.cleanup();
    await mockServer.close();
  });

  it('forwards named flags after the script path (the reported bug)', async () => {
    const result = await cli.run('run', scriptPath, '--from', '2025-01-01', '--to', '2025-01-31');

    expect(result.exitCode).toBe(0);
    const { flags } = parseForwarded(result.stdout);
    expect(flags).toEqual({ from: '2025-01-01', to: '2025-01-31' });
  });

  it('forwards a boolean named flag', async () => {
    const result = await cli.run('run', scriptPath, '--mine');

    expect(result.exitCode).toBe(0);
    const { flags } = parseForwarded(result.stdout);
    expect(flags.mine).toBe(true);
  });

  it('forwards positional args after a slash-containing script path (no module-not-found crash)', async () => {
    const result = await cli.run('run', scriptPath, '2025-01-01', '2025-01-31');

    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain('ERR_MODULE_NOT_FOUND');
    const { args } = parseForwarded(result.stdout);
    expect(args).toEqual(['2025-01-01', '2025-01-31']);
  });

  it('treats a leading --dry-run as a CLI flag and still forwards script flags', async () => {
    const result = await cli.run('run', '--dry-run', scriptPath, '--from', 'x');

    expect(result.exitCode).toBe(0);
    const { flags } = parseForwarded(result.stdout);
    expect(flags).toEqual({ from: 'x' });
  });

  it('supports the `script` alias', async () => {
    const result = await cli.run('script', scriptPath, '--from', 'y');

    expect(result.exitCode).toBe(0);
    const { flags } = parseForwarded(result.stdout);
    expect(flags).toEqual({ from: 'y' });
  });
});
