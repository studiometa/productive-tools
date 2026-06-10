/**
 * Remote execution for `run_script`.
 *
 * When `PRODUCTIVE_MCP_RUN_RUNNER_URL` is set, the front server forwards a
 * `run_script` call to a separate runner over a single stateless HTTP POST,
 * instead of executing the QuickJS sandbox in-process. This keeps the front
 * small and isolates a script's memory/CPU (and any OOM) on the runner.
 *
 * The contract is deliberately infrastructure-agnostic — any service that
 * accepts the payload and returns a `ToolResult` works (a Fly machine pool, a
 * load balancer in front of several runners, a serverless function, …). It is
 * stateless (everything needed is in the body) and must NOT be retried at the
 * proxy layer, since a non-dry-run script may mutate.
 */

import { timingSafeEqual } from 'node:crypto';

import type { ProductiveCredentials } from '../auth.js';
import type { ToolResult } from '../handlers/types.js';

import { errorResult } from '../handlers/utils.js';

export interface RunnerConfig {
  /** Full URL of the runner's `/run` endpoint (front → runner). */
  url?: string;
  /** Shared secret the runner requires (defends the hop even on private nets). */
  token?: string;
  /** Front-side wall-clock timeout for the whole remote call, in ms. */
  timeoutMs: number;
}

/** Request body sent to the runner's `/run` endpoint. */
export interface RunScriptPayload {
  code: string;
  args: string[];
  flags: Record<string, unknown>;
  dry_run: boolean;
  credentials: ProductiveCredentials;
}

const DEFAULT_RUNNER_TIMEOUT_MS = 30_000;

/** Resolve runner configuration from the environment. */
export function resolveRunnerConfig(env: NodeJS.ProcessEnv = process.env): RunnerConfig {
  const raw = env.PRODUCTIVE_MCP_RUN_RUNNER_TIMEOUT_MS;
  const parsed = raw === undefined ? NaN : Number(raw);
  const timeoutMs = Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_RUNNER_TIMEOUT_MS;
  return {
    url: env.PRODUCTIVE_MCP_RUN_RUNNER_URL || undefined,
    token: env.PRODUCTIVE_MCP_RUN_RUNNER_TOKEN || undefined,
    timeoutMs,
  };
}

/** Whether this server should forward run_script to a remote runner. */
export function isRemoteRunner(env: NodeJS.ProcessEnv = process.env): boolean {
  return !!resolveRunnerConfig(env).url;
}

/** Constant-time comparison of a provided runner token against the expected one. */
export function runnerTokenMatches(
  provided: string | undefined,
  expected: string | undefined,
): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Forward a run_script call to the remote runner. Never throws: any transport
 * or runner error is mapped to an error `ToolResult`.
 */
export async function runScriptRemote(
  payload: RunScriptPayload,
  config: RunnerConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<ToolResult> {
  if (!config.url) {
    return errorResult('Remote runner URL is not configured.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetchImpl(config.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return errorResult(
        `Remote runner returned ${response.status}${detail ? `: ${detail.slice(0, 500)}` : ''}`,
      );
    }

    return (await response.json()) as ToolResult;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return errorResult(`Remote runner timed out after ${config.timeoutMs}ms.`);
    }
    return errorResult(
      `Remote runner request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    clearTimeout(timer);
  }
}
