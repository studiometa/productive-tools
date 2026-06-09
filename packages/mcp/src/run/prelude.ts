/**
 * Guest-side JavaScript prelude injected into the sandbox before user code.
 *
 * It builds the `productive`, `api`, `output`, `args`, and `flags` globals on
 * top of two host primitives provided by the engine:
 *
 * - `__hostCall(channel, payloadJson)` → Promise<resultJson> — bridged API call
 * - `__emit(entryJson)` — synchronous output buffering
 *
 * The surface deliberately mirrors the `productive` tool's resource/action
 * model (what agents already know) rather than the fluent SDK, since no SDK
 * code runs inside the sandbox.
 */

import { RESOURCES } from '@studiometa/productive-core';

/**
 * Resources that don't map to a simple list/get/create/update shape. These are
 * still reachable through the low-level `productive(resource, action, params)`
 * call, just without a convenience accessor.
 */
const NON_DATA_RESOURCES = new Set(['batch', 'search', 'summaries', 'workflows', 'reports']);

/** Resources that get a `productive.<resource>` convenience accessor. */
export const SCRIPT_RESOURCES = RESOURCES.filter((r) => !NON_DATA_RESOURCES.has(r));

export interface PreludeOptions {
  args: string[];
  flags: Record<string, unknown>;
}

/**
 * Build the prelude source for a run.
 *
 * `args` and `flags` are embedded as JSON literals (safe — JSON is a subset of
 * JS expression syntax).
 */
export function buildPrelude(opts: PreludeOptions): string {
  return `
const __channel = (channel, payload) =>
  __hostCall(channel, JSON.stringify(payload)).then((s) => JSON.parse(s));

const __out = (type, data) => {
  let payload;
  try {
    payload = JSON.stringify({ type, data });
  } catch (e) {
    // A circular structure / BigInt would otherwise abort the whole script;
    // emit a placeholder so output.* is best-effort instead.
    payload = JSON.stringify({ type, data: '[unserializable: ' + String((e && e.message) || e) + ']' });
  }
  __emit(payload);
};

// Routing keys (resource/action/id/filter/path) are applied LAST so a
// user-supplied param of the same name can never silently change routing.
const productive = (resource, action, params = {}) =>
  __channel('productive', Object.assign({}, params, { resource, action }));

for (const __r of ${JSON.stringify(SCRIPT_RESOURCES)}) {
  productive[__r] = {
    list: (filter = {}, opts = {}) =>
      __channel('productive', Object.assign({}, opts, { resource: __r, action: 'list', filter })),
    get: (id, opts = {}) =>
      __channel('productive', Object.assign({}, opts, { resource: __r, action: 'get', id })),
    create: (params = {}) =>
      __channel('productive', Object.assign({}, params, { resource: __r, action: 'create' })),
    update: (id, params = {}) =>
      __channel('productive', Object.assign({}, params, { resource: __r, action: 'update', id })),
  };
}

const api = {
  read: (path, opts = {}) => __channel('api_read', Object.assign({}, opts, { path })),
  write: (method, path, body) => __channel('api_write', { method, path, body, confirm: true }),
};

const output = {
  json: (d) => __out('json', d),
  table: (d) => __out('table', d),
  csv: (d) => __out('csv', d),
  text: (t) => __out('text', String(t)),
  print: (t) => __out('text', String(t)),
  log: (...a) =>
    __out('log', a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')),
  info: (m) => __out('info', String(m)),
  warn: (m) => __out('warn', String(m)),
  error: (m) => __out('error', String(m)),
  success: (m) => __out('success', String(m)),
};

const args = ${JSON.stringify(opts.args)};
const flags = ${JSON.stringify(opts.flags)};

Object.assign(globalThis, { productive, api, output, args, flags });
`;
}
