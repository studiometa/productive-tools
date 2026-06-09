/**
 * Handler for the `run_script` tool.
 *
 * Executes an agent-authored JavaScript/TypeScript script inside a QuickJS
 * sandbox. The script reaches Productive only through the host bridge, which
 * re-enters `executeToolWithCredentials` — so it inherits credential scoping,
 * rate limiting, and validation, and has no other capabilities.
 *
 * Disabled by default; enable with `PRODUCTIVE_MCP_ENABLE_RUN=true`.
 */

import type { ProductiveCredentials } from '../auth.js';
import type { BridgeChannel, ToolExecutor } from '../run/bridge.js';
import type { ToolResult } from './types.js';

import { UserInputError } from '../errors.js';
import { createBridge } from '../run/bridge.js';
import { runScript, ScriptError } from '../run/engine.js';
import { isRunScriptEnabled, resolveRunLimits } from '../run/limits.js';
import { renderRunResult } from '../run/render.js';
import { stripTypes } from '../run/strip.js';
import { errorResult, inputErrorResult } from './utils.js';

export interface RunScriptArgs {
  code?: unknown;
  args?: unknown;
  flags?: unknown;
  dry_run?: unknown;
}

/** Coerce the `args` argument into a string array. */
function normalizeArgs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v));
}

/** Coerce the `flags` argument into a plain object. */
function normalizeFlags(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

/**
 * Execute the `run_script` tool.
 */
export async function handleRunScript(
  rawArgs: RunScriptArgs,
  credentials: ProductiveCredentials,
  exec: ToolExecutor,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ToolResult> {
  if (!isRunScriptEnabled(env)) {
    return inputErrorResult(
      new UserInputError(
        'run_script is disabled. Set PRODUCTIVE_MCP_ENABLE_RUN=true to enable it.',
      ),
    );
  }

  if (typeof rawArgs.code !== 'string' || rawArgs.code.trim() === '') {
    return inputErrorResult(
      new UserInputError('code is required and must be a non-empty string.', [
        'Provide a JavaScript/TypeScript script in the "code" parameter.',
        'Available globals: productive(resource, action, params), api.read/write, output.*, args, flags.',
        'Return a value to surface it as the result; use output.json(...) for additional data.',
      ]),
    );
  }

  const limits = resolveRunLimits(env);
  const codeBytes = Buffer.byteLength(rawArgs.code, 'utf8');
  if (codeBytes > limits.maxCodeBytes) {
    return inputErrorResult(
      new UserInputError(`Script is too large (${codeBytes} bytes, max ${limits.maxCodeBytes}).`),
    );
  }

  const dryRun = rawArgs.dry_run === true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limits.timeoutMs);

  try {
    const bridge = createBridge({ credentials, exec, limits, dryRun, signal: controller.signal });
    const result = await runScript({
      code: stripTypes(rawArgs.code),
      args: normalizeArgs(rawArgs.args),
      flags: normalizeFlags(rawArgs.flags),
      limits,
      signal: controller.signal,
      hostCall: (channel, payload) => bridge.call(channel as BridgeChannel, payload),
    });

    const stats = bridge.getStats();
    const run = {
      apiCalls: stats.apiCalls,
      dryRun,
      ...(result.truncated ? { outputTruncated: true } : {}),
      ...(dryRun ? { recorded: stats.recorded } : {}),
    };

    // Return both: `structuredContent` for hosts that consume structured tool
    // output (matches the tool's declared outputSchema), and a Markdown `text`
    // block so text-only clients see formatted tables/JSON/logs.
    return {
      content: [
        {
          type: 'text',
          text: renderRunResult({ result: result.result, output: result.output, run }),
        },
      ],
      structuredContent: { result: result.result, output: result.output, _run: run },
    };
  } catch (error) {
    if (error instanceof ScriptError) {
      return errorResult(error.message);
    }
    return errorResult(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }
}
