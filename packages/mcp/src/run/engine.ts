/**
 * QuickJS-WASM execution engine for sandboxed scripts.
 *
 * Each run gets a fresh QuickJS context (isolated globals + heap) created from
 * a single, process-wide cached WASM module. The sandbox has no ambient
 * capabilities: the only host functions exposed are `__hostCall` (bridged API
 * access, returns a real guest Promise so scripts can `await` naturally) and
 * `__emit` (output buffering).
 *
 * Limits enforced here:
 * - memory   — `runtime.setMemoryLimit`
 * - CPU/loop — an interrupt handler with a wall-clock deadline (fires even
 *              while the host event loop is blocked by a synchronous loop)
 * - hang     — an abort-signal race around the async completion wait
 * - output   — buffered output is capped and flagged as truncated
 */

import variant from '@jitl/quickjs-singlefile-cjs-release-sync';
import {
  newQuickJSWASMModuleFromVariant,
  type QuickJSContext,
  type QuickJSDeferredPromise,
  type QuickJSWASMModule,
} from 'quickjs-emscripten-core';

import type { RunLimits } from './limits.js';

import { buildPrelude } from './prelude.js';

/** A single buffered output entry produced by `output.*`. */
export interface OutputEntry {
  type: string;
  data: unknown;
}

/** Successful engine result. */
export interface EngineResult {
  result: unknown;
  output: OutputEntry[];
  truncated: boolean;
}

/**
 * Host call performed on behalf of the guest. Returns the result as a JSON
 * **string** (the text the tool already produced), which is handed straight to
 * the guest without a re-serialization round trip.
 */
export type HostCall = (channel: string, payload: Record<string, unknown>) => Promise<string>;

export interface RunScriptInput {
  code: string;
  args: string[];
  flags: Record<string, unknown>;
  limits: RunLimits;
  signal: AbortSignal;
  hostCall: HostCall;
}

/** Error raised when a script fails to compile, throws, or times out. */
export class ScriptError extends Error {
  public readonly stackTrace?: string;
  constructor(message: string, stackTrace?: string) {
    super(message);
    this.name = 'ScriptError';
    this.stackTrace = stackTrace;
  }
}

let modulePromise: Promise<QuickJSWASMModule> | undefined;

/**
 * Lazily create and cache the QuickJS WASM module (decision: cache the
 * compiled module across runs; each run still gets a fresh context).
 */
export function getQuickJSModule(): Promise<QuickJSWASMModule> {
  if (!modulePromise) {
    modulePromise = newQuickJSWASMModuleFromVariant(variant);
  }
  return modulePromise;
}

/** Build the full source: prelude + user code wrapped in an async entrypoint. */
function buildSource(input: RunScriptInput): string {
  const prelude = buildPrelude({ args: input.args, flags: input.flags });
  return `${prelude}
async function __main() {
${input.code}
}
__main().then(
  (v) => {
    try {
      __resolve(JSON.stringify(v === undefined ? null : v));
    } catch (e) {
      __reject(JSON.stringify({ message: 'Result is not serializable: ' + String((e && e.message) || e) }));
    }
  },
  (e) => __reject(JSON.stringify({ message: String((e && e.message) || e), stack: String((e && e.stack) || '') })),
);`;
}

/** A promise that rejects when the abort signal fires. */
function abortPromise(signal: AbortSignal): { promise: Promise<never>; cleanup: () => void } {
  let onAbort: () => void = () => {};
  const promise = new Promise<never>((_resolve, reject) => {
    if (signal.aborted) {
      reject(new ScriptError('Script execution timed out'));
      return;
    }
    onAbort = () => reject(new ScriptError('Script execution timed out'));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  // Swallow the rejection if it is never raced (avoids unhandled rejection).
  promise.catch(() => {});
  return { promise, cleanup: () => signal.removeEventListener('abort', onAbort) };
}

interface Captured {
  ok: boolean;
  value?: unknown;
  message?: string;
  stack?: string;
}

/**
 * Register the synchronous host functions (`__emit`, `__resolve`, `__reject`)
 * and the async `__hostCall`, wiring output buffering and result capture.
 */
function installHostFunctions(
  ctx: QuickJSContext,
  input: RunScriptInput,
  state: {
    output: OutputEntry[];
    bytes: number;
    truncated: boolean;
    captured?: Captured;
    disposed: boolean;
    pendingDeferreds: Set<QuickJSDeferredPromise>;
  },
): void {
  const emit = ctx.newFunction('__emit', (handle) => {
    const raw = ctx.getString(handle);
    // Count UTF-8 bytes (not UTF-16 code units) so multi-byte output can't
    // overshoot the byte cap.
    state.bytes += Buffer.byteLength(raw, 'utf8');
    if (state.bytes > input.limits.maxOutputBytes) {
      state.truncated = true;
      return;
    }
    try {
      state.output.push(JSON.parse(raw) as OutputEntry);
    } catch {
      // Ignore malformed emit payloads.
    }
  });
  emit.consume((f) => ctx.setProp(ctx.global, '__emit', f));

  const resolve = ctx.newFunction('__resolve', (handle) => {
    const raw = ctx.getString(handle);
    try {
      state.captured = { ok: true, value: JSON.parse(raw) };
    } catch {
      state.captured = { ok: true, value: raw };
    }
  });
  resolve.consume((f) => ctx.setProp(ctx.global, '__resolve', f));

  const reject = ctx.newFunction('__reject', (handle) => {
    const raw = ctx.getString(handle);
    try {
      const parsed = JSON.parse(raw) as { message?: string; stack?: string };
      state.captured = { ok: false, message: parsed.message ?? 'Error', stack: parsed.stack };
    } catch {
      state.captured = { ok: false, message: raw };
    }
  });
  reject.consume((f) => ctx.setProp(ctx.global, '__reject', f));

  const hostCall = ctx.newFunction('__hostCall', (channelHandle, payloadHandle) => {
    const channel = ctx.getString(channelHandle);
    const payloadStr = ctx.getString(payloadHandle);
    const deferred = ctx.newPromise();
    // Track until settled so an aborted/timed-out run can dispose any
    // still-pending deferred before tearing down the context — disposing a
    // context with a live, unsettled promise trips a fatal QuickJS GC assert.
    state.pendingDeferreds.add(deferred);

    void (async () => {
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(payloadStr) as Record<string, unknown>;
      } catch {
        // Treat unparseable payloads as empty.
      }
      // hostCall already returns JSON text — pass it through unchanged.
      return input.hostCall(channel, payload);
    })().then(
      (jsonStr) => {
        // The run may have been torn down (timeout/abort) while the host call
        // was in flight — touching a disposed context would throw.
        if (state.disposed) return;
        state.pendingDeferreds.delete(deferred);
        const handle = ctx.newString(jsonStr);
        deferred.resolve(handle);
        handle.dispose();
      },
      (err: unknown) => {
        if (state.disposed) return;
        state.pendingDeferreds.delete(deferred);
        const message = err instanceof Error ? err.message : String(err);
        // Reject with a guest Error so scripts can read `e.message`.
        const handle = ctx.newError(message);
        deferred.reject(handle);
        handle.dispose();
      },
    );

    // Drive the guest microtask queue whenever this promise settles. Guard
    // against a torn-down context and swallow any teardown-race throw so it
    // can't escape as an unhandled rejection.
    deferred.settled.then(() => {
      if (state.disposed) return;
      try {
        ctx.runtime.executePendingJobs();
      } catch {
        // Context was disposed mid-flight — nothing left to drive.
      }
    });
    return deferred.handle;
  });
  hostCall.consume((f) => ctx.setProp(ctx.global, '__hostCall', f));
}

/**
 * Run a script to completion in a sandboxed QuickJS context.
 *
 * @throws {ScriptError} on compile error, uncaught guest error, or timeout.
 */
export async function runScript(input: RunScriptInput): Promise<EngineResult> {
  const mod = await getQuickJSModule();
  const ctx = mod.newContext();
  const runtime = ctx.runtime;

  runtime.setMemoryLimit(input.limits.memoryBytes);
  runtime.setMaxStackSize(1024 * 1024);

  const deadline = Date.now() + input.limits.timeoutMs;
  let interrupted = false;
  runtime.setInterruptHandler(() => {
    if (Date.now() > deadline || input.signal.aborted) {
      interrupted = true;
      return true;
    }
    return false;
  });

  const state = {
    output: [] as OutputEntry[],
    bytes: 0,
    truncated: false,
    captured: undefined as Captured | undefined,
    disposed: false,
    pendingDeferreds: new Set<QuickJSDeferredPromise>(),
  };
  const abort = abortPromise(input.signal);

  try {
    installHostFunctions(ctx, input, state);

    const evalResult = ctx.evalCode(buildSource(input), 'script.js');
    if (evalResult.error) {
      const dumped = safeDump(ctx, evalResult.error);
      evalResult.error.dispose();
      if (interrupted) {
        throw new ScriptError('Script execution timed out');
      }
      throw new ScriptError(formatGuestError(dumped));
    }

    const topPromise = evalResult.value;
    const native = ctx.resolvePromise(topPromise);
    topPromise.dispose();
    runtime.executePendingJobs();

    const settled = await Promise.race([native, abort.promise]);
    if (settled.error) settled.error.dispose();
    else settled.value.dispose();
  } finally {
    abort.cleanup();
    // Mark disposed before tearing down so any in-flight host-call
    // continuation skips touching the context.
    state.disposed = true;
    // Dispose any still-pending deferreds (e.g. an in-flight call when the run
    // timed out/aborted) so the context has no live promises to assert on.
    for (const deferred of state.pendingDeferreds) {
      try {
        deferred.dispose();
      } catch {
        // Already settled/freed — ignore.
      }
    }
    ctx.dispose();
  }

  if (interrupted || input.signal.aborted) {
    throw new ScriptError('Script execution timed out');
  }
  if (!state.captured) {
    throw new ScriptError('Script did not complete');
  }
  if (!state.captured.ok) {
    throw new ScriptError(state.captured.message ?? 'Script error', state.captured.stack);
  }

  return { result: state.captured.value, output: state.output, truncated: state.truncated };
}

/** Dump a guest handle to a host value, tolerating dump failures (e.g. OOM). */
function safeDump(
  ctx: QuickJSContext,
  handle: import('quickjs-emscripten-core').QuickJSHandle,
): unknown {
  try {
    return ctx.dump(handle);
  } catch {
    return undefined;
  }
}

/** Format a dumped guest error into a single-line message. */
function formatGuestError(dumped: unknown): string {
  if (dumped && typeof dumped === 'object') {
    const err = dumped as { name?: string; message?: string };
    if (err.message) {
      return err.name ? `${err.name}: ${err.message}` : err.message;
    }
  }
  if (typeof dumped === 'string') return dumped;
  return 'Script failed to compile';
}
