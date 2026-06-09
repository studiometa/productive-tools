/**
 * Resource limits and feature gating for the sandboxed `run_script` tool.
 *
 * The tool is disabled by default and must be explicitly enabled via
 * `PRODUCTIVE_MCP_ENABLE_RUN=true` — same gating model as `api_write`. This
 * keeps hosted HTTP deployments safe until an operator opts in.
 *
 * Every limit is configurable via an environment variable so operators can
 * tune the sandbox for their deployment. Invalid values fall back to the
 * default rather than throwing.
 */

/** Resolved resource limits for a single script run. */
export interface RunLimits {
  /** Wall-clock budget for the whole run, in milliseconds. */
  timeoutMs: number;
  /** Maximum heap the QuickJS runtime may allocate, in bytes. */
  memoryBytes: number;
  /** Maximum number of bridged API calls a single run may make. */
  maxApiCalls: number;
  /** Maximum serialized size of buffered output + result, in bytes. */
  maxOutputBytes: number;
  /** Maximum size of the submitted script source, in bytes. */
  maxCodeBytes: number;
}

const DEFAULTS = {
  timeoutMs: 5_000,
  memoryMb: 64,
  maxApiCalls: 50,
  maxOutputKb: 256,
  maxCodeKb: 128,
} as const;

/**
 * Whether the `run_script` tool is enabled. Off unless explicitly turned on.
 */
export function isRunScriptEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.PRODUCTIVE_MCP_ENABLE_RUN === 'true';
}

/**
 * Parse a positive integer from an env var, falling back when missing/invalid.
 */
function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Resolve the active resource limits from the environment.
 */
export function resolveRunLimits(env: NodeJS.ProcessEnv = process.env): RunLimits {
  return {
    timeoutMs: parsePositiveInt(env.PRODUCTIVE_MCP_RUN_TIMEOUT_MS, DEFAULTS.timeoutMs),
    memoryBytes:
      parsePositiveInt(env.PRODUCTIVE_MCP_RUN_MEMORY_MB, DEFAULTS.memoryMb) * 1024 * 1024,
    maxApiCalls: parsePositiveInt(env.PRODUCTIVE_MCP_RUN_MAX_API_CALLS, DEFAULTS.maxApiCalls),
    maxOutputBytes:
      parsePositiveInt(env.PRODUCTIVE_MCP_RUN_MAX_OUTPUT_KB, DEFAULTS.maxOutputKb) * 1024,
    maxCodeBytes: parsePositiveInt(env.PRODUCTIVE_MCP_RUN_MAX_CODE_KB, DEFAULTS.maxCodeKb) * 1024,
  };
}
