/**
 * Tests for remote run_script execution.
 */

import { describe, it, expect, vi } from 'vitest';

import type { ProductiveCredentials } from '../auth.js';

import {
  isRemoteRunner,
  resolveRunnerConfig,
  runnerTokenMatches,
  runScriptRemote,
  type RunScriptPayload,
} from './remote.js';

const env = (o: Record<string, string>): NodeJS.ProcessEnv => o as NodeJS.ProcessEnv;

const credentials: ProductiveCredentials = {
  apiToken: 't',
  organizationId: 'o',
  userId: 'u',
};

const payload: RunScriptPayload = {
  code: 'return 1;',
  args: [],
  flags: {},
  dry_run: false,
  credentials,
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('resolveRunnerConfig', () => {
  it('returns undefined url/token and the default timeout when unset', () => {
    expect(resolveRunnerConfig(env({}))).toEqual({
      url: undefined,
      token: undefined,
      timeoutMs: 30_000,
    });
  });

  it('reads url, token, and a custom timeout', () => {
    expect(
      resolveRunnerConfig(
        env({
          PRODUCTIVE_MCP_RUN_RUNNER_URL: 'http://runner/run',
          PRODUCTIVE_MCP_RUN_RUNNER_TOKEN: 'secret',
          PRODUCTIVE_MCP_RUN_RUNNER_TIMEOUT_MS: '5000',
        }),
      ),
    ).toEqual({ url: 'http://runner/run', token: 'secret', timeoutMs: 5_000 });
  });

  it('falls back to the default timeout for invalid values', () => {
    expect(
      resolveRunnerConfig(env({ PRODUCTIVE_MCP_RUN_RUNNER_TIMEOUT_MS: 'nope' })).timeoutMs,
    ).toBe(30_000);
  });
});

describe('isRemoteRunner', () => {
  it('is true only when a runner URL is set', () => {
    expect(isRemoteRunner(env({}))).toBe(false);
    expect(isRemoteRunner(env({ PRODUCTIVE_MCP_RUN_RUNNER_URL: 'http://r/run' }))).toBe(true);
  });
});

describe('runnerTokenMatches', () => {
  it('matches identical tokens and rejects everything else', () => {
    expect(runnerTokenMatches('abc', 'abc')).toBe(true);
    expect(runnerTokenMatches('abc', 'abd')).toBe(false);
    expect(runnerTokenMatches('abc', 'abcd')).toBe(false); // length mismatch
    expect(runnerTokenMatches(undefined, 'abc')).toBe(false);
    expect(runnerTokenMatches('abc', undefined)).toBe(false);
    expect(runnerTokenMatches(undefined, undefined)).toBe(false);
  });
});

describe('runScriptRemote', () => {
  const config = { url: 'http://runner.internal/run', token: 'secret', timeoutMs: 1_000 };

  it('POSTs the payload with auth header and returns the runner ToolResult', async () => {
    const toolResult = {
      content: [{ type: 'text', text: 'ok' }],
      structuredContent: { result: 1 },
    };
    const fetchImpl = vi.fn(async () => jsonResponse(toolResult)) as unknown as typeof fetch;

    const result = await runScriptRemote(payload, config, fetchImpl);

    expect(result).toEqual(toolResult);
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(config.url);
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe('Bearer secret');
    expect(JSON.parse(init.body)).toMatchObject({ code: 'return 1;', credentials });
  });

  it('omits the auth header when no token is configured', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ content: [] })) as unknown as typeof fetch;
    await runScriptRemote(payload, { url: 'http://r/run', timeoutMs: 1_000 }, fetchImpl);
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers.authorization).toBeUndefined();
  });

  it('returns an error result on a non-2xx response', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('boom', { status: 500 }),
    ) as unknown as typeof fetch;
    const result = await runScriptRemote(payload, config, fetchImpl);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('500');
  });

  it('maps an abort to a timeout error result', async () => {
    const fetchImpl = vi.fn(async () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    }) as unknown as typeof fetch;
    const result = await runScriptRemote(payload, config, fetchImpl);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('timed out');
  });

  it('maps a transport error to an error result', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    const result = await runScriptRemote(payload, config, fetchImpl);
    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('ECONNREFUSED');
  });

  it('errors when no url is configured', async () => {
    const result = await runScriptRemote(payload, { timeoutMs: 1_000 });
    expect(result.isError).toBe(true);
  });
});
