/**
 * Tests for the /run endpoint core logic.
 */

import { describe, it, expect, vi } from 'vitest';

import type { ProductiveCredentials } from '../auth.js';
import type { RunEndpointExecutor } from './run-endpoint.js';
import type { ToolResult } from './types.js';

import { executeRunRequest } from './run-endpoint.js';

const env = (o: Record<string, string>): NodeJS.ProcessEnv => o as NodeJS.ProcessEnv;
const runnerEnv = env({ PRODUCTIVE_MCP_RUN_RUNNER_TOKEN: 'secret' });

const credentials = { organizationId: 'o', apiToken: 't', userId: 'u' };

function okResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }] };
}

const body = { code: 'return 1;', args: ['a'], flags: { x: 1 }, dry_run: true, credentials };

describe('executeRunRequest', () => {
  it('returns 404 when no runner token is configured', async () => {
    const exec = vi.fn() as unknown as RunEndpointExecutor;
    const res = await executeRunRequest(body, 'Bearer secret', exec, env({}));
    expect(res.status).toBe(404);
    expect(exec).not.toHaveBeenCalled();
  });

  it('returns 401 on a missing or wrong token', async () => {
    const exec = vi.fn() as unknown as RunEndpointExecutor;
    expect((await executeRunRequest(body, null, exec, runnerEnv)).status).toBe(401);
    expect((await executeRunRequest(body, 'Bearer nope', exec, runnerEnv)).status).toBe(401);
    expect(exec).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid body', async () => {
    const exec = vi.fn() as unknown as RunEndpointExecutor;
    expect((await executeRunRequest(undefined, 'Bearer secret', exec, runnerEnv)).status).toBe(400);
  });

  it('returns 400 for missing/invalid credentials', async () => {
    const exec = vi.fn() as unknown as RunEndpointExecutor;
    const res = await executeRunRequest({ code: 'return 1;' }, 'Bearer secret', exec, runnerEnv);
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toContain('credentials');
  });

  it('returns 400 for missing code', async () => {
    const exec = vi.fn() as unknown as RunEndpointExecutor;
    const res = await executeRunRequest({ credentials }, 'Bearer secret', exec, runnerEnv);
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toContain('code');
  });

  it('runs the tool and returns 200 with the ToolResult', async () => {
    const exec = vi.fn(async () => okResult('done')) as RunEndpointExecutor;
    const res = await executeRunRequest(body, 'Bearer secret', exec, runnerEnv);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(okResult('done'));
    expect(exec).toHaveBeenCalledWith(
      'run_script',
      { code: 'return 1;', args: ['a'], flags: { x: 1 }, dry_run: true },
      credentials as ProductiveCredentials,
    );
  });
});
