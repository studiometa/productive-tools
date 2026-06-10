/**
 * `/run` HTTP endpoint — the runner side of remote `run_script` execution.
 *
 * A front server (with `PRODUCTIVE_MCP_RUN_RUNNER_URL` set) POSTs a stateless
 * payload here; this endpoint authenticates the hop with a shared token and
 * runs the script through the normal `run_script` pipeline (so the runner
 * enforces its own `PRODUCTIVE_MCP_ENABLE_RUN` and limits). The result is the
 * exact `ToolResult` the front relays back to the client.
 *
 * The endpoint only exists when `PRODUCTIVE_MCP_RUN_RUNNER_TOKEN` is set —
 * otherwise it reports as not found, so a normal deployment never exposes it.
 */

import type { ProductiveCredentials } from '../auth.js';
import type { ToolResult } from './types.js';

import { resolveRunnerConfig, runnerTokenMatches } from '../run/remote.js';

/** Executor signature (executeToolWithCredentials), injected for testability. */
export type RunEndpointExecutor = (
  name: string,
  args: Record<string, unknown>,
  credentials: ProductiveCredentials,
) => Promise<ToolResult>;

export interface RunEndpointResult {
  status: number;
  body: unknown;
}

/** Extract a bearer token from an Authorization header. */
function bearer(authHeader: string | null | undefined): string | undefined {
  const match = authHeader?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

/** Validate that a value is a usable credentials object. */
function toCredentials(value: unknown): ProductiveCredentials | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const c = value as Record<string, unknown>;
  if (typeof c.organizationId !== 'string' || typeof c.apiToken !== 'string') return undefined;
  return {
    organizationId: c.organizationId,
    apiToken: c.apiToken,
    userId: typeof c.userId === 'string' ? c.userId : undefined,
  };
}

/**
 * Core logic for the `/run` endpoint, decoupled from the HTTP framework.
 *
 * @returns the HTTP status and JSON body to send back.
 */
export async function executeRunRequest(
  rawBody: unknown,
  authHeader: string | null | undefined,
  exec: RunEndpointExecutor,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RunEndpointResult> {
  const { token } = resolveRunnerConfig(env);

  // No token configured → this server is not a runner; hide the endpoint.
  if (!token) {
    return { status: 404, body: { error: 'Not found' } };
  }

  if (!runnerTokenMatches(bearer(authHeader), token)) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  if (!rawBody || typeof rawBody !== 'object') {
    return { status: 400, body: { error: 'Invalid JSON body' } };
  }

  const body = rawBody as Record<string, unknown>;
  const credentials = toCredentials(body.credentials);
  if (!credentials) {
    return { status: 400, body: { error: 'Missing or invalid credentials' } };
  }

  if (typeof body.code !== 'string' || body.code.trim() === '') {
    return { status: 400, body: { error: 'code is required' } };
  }

  // Reuse the normal tool pipeline: executeToolWithCredentials('run_script', …)
  // routes to handleRunScript, which (no runner URL set on the runner) executes
  // the sandbox locally and enforces PRODUCTIVE_MCP_ENABLE_RUN + limits.
  const result = await exec(
    'run_script',
    {
      code: body.code,
      args: body.args,
      flags: body.flags,
      dry_run: body.dry_run,
    },
    credentials,
  );

  return { status: 200, body: result };
}
