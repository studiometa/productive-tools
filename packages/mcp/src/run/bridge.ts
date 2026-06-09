/**
 * Host-side capability bridge for sandboxed scripts.
 *
 * The QuickJS sandbox has no network, filesystem, or process access. The only
 * way a script reaches Productive is through this bridge, which re-enters the
 * exact same `executeToolWithCredentials` pipeline used by every other MCP tool
 * call. That means scripts automatically inherit credential scoping, rate
 * limiting, include validation, and formatting — and egress is constrained to
 * the Productive API by construction.
 *
 * The bridge also enforces the per-run API-call budget, honours the run's
 * abort signal (wall-clock timeout), and implements dry-run by classifying
 * mutating operations and recording them instead of executing.
 */

import type { ProductiveCredentials } from '../auth.js';
import type { ToolResult } from '../handlers/types.js';
import type { RunLimits } from './limits.js';

/** The subset of `executeToolWithCredentials` the bridge depends on. */
export type ToolExecutor = (
  name: string,
  args: Record<string, unknown>,
  credentials: ProductiveCredentials,
) => Promise<ToolResult>;

/** Logical channels a script may call through. */
export type BridgeChannel = 'productive' | 'api_read' | 'api_write';

/** A mutating call recorded (not executed) during a dry run. */
export interface RecordedCall {
  channel: BridgeChannel;
  payload: Record<string, unknown>;
}

export interface BridgeOptions {
  credentials: ProductiveCredentials;
  exec: ToolExecutor;
  limits: RunLimits;
  dryRun: boolean;
  signal: AbortSignal;
}

export interface Bridge {
  /**
   * Execute a single bridged call, returning the result as a JSON **string**
   * (the text the tool already produced). Returning text rather than a parsed
   * value lets the engine hand it straight to the guest without an extra
   * parse-then-restringify round trip. Throws on error results so guest-side
   * `try/catch` works naturally.
   */
  call(channel: BridgeChannel, payload: Record<string, unknown>): Promise<string>;
  /** Snapshot of usage so the handler can report it. */
  getStats(): { apiCalls: number; recorded: RecordedCall[] };
}

/** Productive actions that mutate data — intercepted in dry-run mode. */
const MUTATING_ACTIONS = new Set([
  'create',
  'update',
  'delete',
  'start',
  'stop',
  'reopen',
  'complete_task',
  'log_day',
]);

/** Whether a call would mutate data (used for dry-run classification). */
function isMutating(channel: BridgeChannel, payload: Record<string, unknown>): boolean {
  if (channel === 'api_write') return true;
  if (channel === 'productive') return MUTATING_ACTIONS.has(String(payload.action));
  return false;
}

/** Map a channel to its tool name. */
function toolNameFor(channel: BridgeChannel): string {
  return channel === 'productive' ? 'productive' : channel;
}

/**
 * Extract the JSON text from a tool result, throwing on error results so that
 * guest-side `try/catch` works naturally. The text is returned verbatim (MCP
 * handlers already produce JSON via `jsonResult`); the guest parses it once.
 */
function toJsonText(result: ToolResult): string {
  const content = result.content?.[0];
  const text = content && content.type === 'text' ? content.text : undefined;

  if (result.isError) {
    throw new Error(text ?? 'Unknown tool error');
  }
  if (text === undefined) {
    throw new Error('Tool returned no content');
  }
  return text;
}

/**
 * Create a bridge bound to a set of credentials and limits.
 */
export function createBridge(opts: BridgeOptions): Bridge {
  let apiCalls = 0;
  const recorded: RecordedCall[] = [];

  async function call(channel: BridgeChannel, payload: Record<string, unknown>): Promise<string> {
    if (channel !== 'productive' && channel !== 'api_read' && channel !== 'api_write') {
      throw new Error(`Unknown bridge channel: ${channel}`);
    }
    if (opts.signal.aborted) {
      throw new Error('Script execution timed out');
    }

    // Check before incrementing so the counter never exceeds the budget and
    // reported stats reflect only calls that actually proceeded.
    if (apiCalls >= opts.limits.maxApiCalls) {
      throw new Error(`API call budget exceeded (max ${opts.limits.maxApiCalls})`);
    }
    apiCalls += 1;

    if (opts.dryRun && isMutating(channel, payload)) {
      recorded.push({ channel, payload });
      return JSON.stringify({ _dryRun: true, channel, payload });
    }

    const result = await opts.exec(toolNameFor(channel), payload, opts.credentials);
    return toJsonText(result);
  }

  return {
    call,
    getStats: () => ({ apiCalls, recorded: [...recorded] }),
  };
}
